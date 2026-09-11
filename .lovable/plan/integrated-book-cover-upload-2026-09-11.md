# Integrated book-cover upload

## What will change
- Keep the cover-image picker directly inside the **Add book / Edit book** form.
- Make choosing a photo a simple step while entering the book’s title, price, stock, and category.
- Show the selected cover preview in the same form.
- Remove the separate image-URL option so administrators do not need a second workflow.
- Save the uploaded cover with the book so it appears automatically on shelves, catalogue cards, search suggestions, and the book page.

## Technical details
- Reuse the existing secure `book-covers` storage and upload handling.
- Keep the current image type and 10 MB size checks.
- Preserve existing covers when editing unless a replacement is selected.
- Verify adding and editing a book still works with the integrated cover field.
