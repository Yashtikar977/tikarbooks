
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATALOGUE
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  publisher TEXT,
  isbn TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_percent INT NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  cover_url TEXT,
  cover_color TEXT NOT NULL DEFAULT '#7c3f2e',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  language TEXT DEFAULT 'English',
  pages INT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  is_new_arrival BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books public read" ON public.books FOR SELECT USING (true);
CREATE POLICY "books admin write" ON public.books FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CART / WISHLIST
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist" ON public.wishlist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDERS
CREATE TYPE public.order_status AS ENUM ('placed','confirmed','preparing','ready_or_shipped','delivered','cancelled');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('TBE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  fulfilment TEXT NOT NULL DEFAULT 'delivery',
  address_line TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status public.order_status NOT NULL DEFAULT 'placed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author TEXT,
  cover_color TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  rating INT NOT NULL DEFAULT 5,
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "reviews own read" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews own insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews own update" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews delete" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER t_books BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_categories BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_cart BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_addresses BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_reviews BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_books_category ON public.books(category_id);
CREATE INDEX idx_books_title ON public.books(lower(title));

-- SEED CATEGORIES
INSERT INTO public.categories (name, slug, icon, description, sort_order) VALUES
('School Books','school-books','📚','Textbooks, guides and workbooks for classes 1 to 12.',1),
('College & University','college-university','🎓','Degree course books for arts, commerce and science streams.',2),
('Programming & Technology','programming-technology','💻','Coding, software and technology titles for learners and professionals.',3),
('Competitive Exams','competitive-exams','🧠','MPSC, UPSC, banking, railway and entrance exam preparation.',4),
('Novels & Fiction','novels-fiction','📖','Marathi and English fiction, classics and contemporary novels.',5),
('Science & Reference','science-reference','🔬','Dictionaries, atlases, encyclopaedias and science references.',6),
('Children''s Books','childrens-books','👶','Picture books, story collections and activity books.',7),
('General Knowledge','general-knowledge','📕','Current affairs, yearbooks and general awareness titles.',8),
('Stationery','stationery','✏️','Notebooks, pens, geometry sets and study supplies.',9);

-- SEED BOOKS
INSERT INTO public.books (title, slug, author, publisher, isbn, description, category_id, price, discount_percent, stock, cover_color, rating, rating_count, sold_count, pages, is_featured, is_bestseller, is_new_arrival)
SELECT d.title, d.slug, d.author, d.publisher, d.isbn, d.description, c.id, d.price, d.discount, d.stock, d.color, d.rating, d.rc, d.sold, d.pages, d.feat, d.best, d.new
FROM (VALUES
('NCERT Science Textbook Class 10','ncert-science-class-10','NCERT','NCERT Publications','9788174506542','Complete Class 10 science textbook covering physics, chemistry and biology as per the latest CBSE syllabus.','school-books',260,10,42,'#1f4d3f',4.6,128,310,232,true,true,false),
('Mathematics Class 9 Guide','maths-class-9-guide','Dr. S. R. Deshmukh','Nirali Prakashan','9789385533211','Chapterwise solved examples and practice sets for Class 9 mathematics, aligned with the Maharashtra board.','school-books',340,15,28,'#8a3324',4.4,86,204,368,false,true,false),
('Balbharati English Reader Class 8','balbharati-english-class-8','Balbharati','Maharashtra State Board','9789387856112','Prescribed English reader for Class 8 with exercises and comprehension practice.','school-books',180,5,60,'#2f4858',4.2,54,190,148,false,false,true),
('Class 12 Physics Practice Papers','class-12-physics-papers','P. G. Kulkarni','Target Publications','9789389461122','Twenty full-length practice papers with detailed solutions for Class 12 physics.','school-books',295,12,24,'#4a2c6f',4.3,61,142,256,false,false,true),
('Engineering Mathematics I','engineering-mathematics-i','Dr. B. S. Grewal','Khanna Publishers','9788193328491','Foundational engineering mathematics covering calculus, matrices and differential equations for first year students.','college-university',540,10,18,'#123a5c',4.7,240,410,712,true,true,false),
('Principles of Economics','principles-of-economics','H. L. Ahuja','S. Chand','9789352533015','Comprehensive micro and macro economics text for B.A. and B.Com students.','college-university',495,8,15,'#6b3f1d',4.3,97,168,640,false,false,false),
('Organic Chemistry for B.Sc.','organic-chemistry-bsc','Dr. Meera Joshi','Nirali Prakashan','9789386025784','Reaction mechanisms, nomenclature and problem sets for undergraduate organic chemistry.','college-university',430,12,20,'#3d5a3c',4.4,73,131,520,false,false,true),
('Let Us C','let-us-c','Yashavant Kanetkar','BPB Publications','9789389845686','The classic beginner-friendly introduction to C programming with hundreds of exercises.','programming-technology',385,15,35,'#2b3a67',4.6,512,890,528,true,true,false),
('Python Crash Course for Beginners','python-crash-course-beginners','Eric Matthes','No Starch Press','9781718502703','A hands-on, project-based introduction to Python programming for absolute beginners.','programming-technology',720,20,26,'#1c5d63',4.8,640,760,552,true,true,true),
('Data Structures with C++','data-structures-cpp','Dr. A. K. Sharma','Pearson India','9789332543492','Arrays, linked lists, trees, graphs and algorithm analysis with C++ implementations.','programming-technology',560,10,14,'#563d7c',4.5,188,240,608,false,false,false),
('Web Development Handbook','web-development-handbook','Rahul Bansal','TechPress India','9789390257744','Modern HTML, CSS, JavaScript and React fundamentals with practical projects.','programming-technology',650,18,22,'#0f4c5c',4.4,132,198,480,false,false,true),
('MPSC Rajyaseva Complete Guide','mpsc-rajyaseva-guide','Dr. Anil Pawar','Unique Publications','9789389722017','Full preparation guide for MPSC Rajyaseva prelims with previous year papers.','competitive-exams',780,15,30,'#7a1f2b',4.5,210,388,884,true,true,false),
('UPSC General Studies Manual','upsc-gs-manual','Team Vision','Vision IAS Press','9789391034221','Consolidated general studies coverage for UPSC civil services preliminary examination.','competitive-exams',1150,20,12,'#243b55',4.6,318,412,1120,true,false,false),
('Quantitative Aptitude for Banking','quant-aptitude-banking','R. S. Aggarwal','S. Chand','9789352534022','Shortcut methods and practice sets for banking and railway aptitude sections.','competitive-exams',520,12,40,'#1f5f4e',4.5,410,690,704,false,true,false),
('Marathi Vyakaran for Competitive Exams','marathi-vyakaran-exams','Prof. S. B. Jadhav','Chetana Prakashan','9789385119033','Complete Marathi grammar preparation for state-level competitive examinations.','competitive-exams',350,10,26,'#8b4513',4.3,96,180,320,false,false,true),
('Yayati','yayati','V. S. Khandekar','Mehta Publishing House','9788177665413','Jnanpith-winning Marathi novel retelling the myth of King Yayati and human desire.','novels-fiction',420,10,25,'#6d2932',4.8,540,720,432,true,true,false),
('Mrutyunjay','mrutyunjay','Shivaji Sawant','Mehta Publishing House','9788177665420','The celebrated Marathi epic novel narrating the life of Karna.','novels-fiction',560,12,20,'#4b2e1e',4.9,720,910,656,true,true,false),
('The Alchemist','the-alchemist','Paulo Coelho','HarperCollins','9788172234980','A shepherd boy travels in search of treasure and discovers the wisdom of following his dreams.','novels-fiction',350,15,45,'#b07d2b',4.6,880,1200,208,false,true,false),
('Shyamchi Aai','shyamchi-aai','Sane Guruji','Continental Prakashan','9788174340115','A timeless Marathi classic about a mother''s love and moral upbringing.','novels-fiction',195,5,50,'#3f5d45',4.7,430,650,168,false,false,true),
('Concise Oxford English Dictionary','oxford-english-dictionary','Oxford Editors','Oxford University Press','9780199601080','Authoritative English dictionary with over 240,000 words, phrases and definitions.','science-reference',890,10,16,'#1b3a5b',4.7,260,340,1728,true,false,false),
('Student Atlas of India and the World','student-atlas-india','Orient Editors','Orient BlackSwan','9788125051213','Detailed political, physical and thematic maps for school and competitive exam students.','science-reference',330,8,22,'#2a6f6f',4.4,110,205,144,false,false,false),
('Encyclopedia of Science','encyclopedia-of-science','DK Editors','DK Publishing','9780241412831','Illustrated science encyclopaedia covering physics, chemistry, biology and space.','science-reference',1250,20,9,'#0e3b43',4.8,175,148,360,false,false,true),
('Panchatantra Stories for Children','panchatantra-stories','Vishnu Sharma','Rupa Publications','9788129135001','Classic Indian moral tales retold with colourful illustrations for young readers.','childrens-books',225,10,55,'#c2571a',4.6,320,540,160,true,true,false),
('My First Big Book of Colours','first-big-book-colours','Sunita Rao','Kidz Press','9789389033012','A bright board book introducing colours and everyday objects to toddlers.','childrens-books',180,5,48,'#d1495b',4.3,140,300,32,false,false,true),
('Activity and Puzzle Book Age 6-10','activity-puzzle-book','Neha Kulkarni','Kidz Press','9789389033029','Mazes, colouring pages, word games and puzzles for primary school children.','childrens-books',150,10,62,'#4c956c',4.4,95,260,96,false,false,false),
('Manorama Yearbook 2026','manorama-yearbook-2026','Manorama Editors','Malayala Manorama','9789391590017','Annual reference of current affairs, statistics and general knowledge for exam aspirants.','general-knowledge',450,12,34,'#334f2c',4.5,215,470,1080,true,true,true),
('Lucent General Knowledge','lucent-general-knowledge','Dr. Binay Karna','Lucent Publications','9789384761752','Subjectwise general knowledge coverage widely used for competitive examinations.','general-knowledge',390,15,44,'#7b2d26',4.6,505,820,448,false,true,false),
('India Since Independence','india-since-independence','Bipan Chandra','Penguin India','9780143104094','A detailed account of India''s political and social journey after 1947.','general-knowledge',560,10,13,'#455a64',4.5,190,225,784,false,false,false),
('Classmate Long Notebook (Pack of 6)','classmate-notebook-pack','Classmate','ITC Limited','8901234567890','172-page single line long notebooks, pack of six, ideal for school and college.','stationery',420,12,80,'#2f5d8a',4.4,210,640,172,false,true,false),
('Camlin Geometry Box','camlin-geometry-box','Camlin','Kokuyo Camlin','8901234567891','Complete geometry set with compass, divider, scale, protractor and set squares.','stationery',185,8,65,'#8a5a2b',4.3,150,420,1,false,false,true)
) AS d(title, slug, author, publisher, isbn, description, cat_slug, price, discount, stock, color, rating, rc, sold, pages, feat, best, new)
JOIN public.categories c ON c.slug = d.cat_slug;
