# How to Implement the Rebate Popup in Your Shopify Theme

This guide explains how to add a popup to your Shopify store that alerts users about a cash back rebate for specific items from the "superwinch-rebate-2025" collection, active from September 15, 2025, to November 15, 2025. The popup includes a carousel of qualifying products, options to download or print a rebate form PDF, and a way to email the form link to users.

## Prerequisites
- Access to your Shopify admin (Online Store > Themes > Actions > Edit code).
- A duplicate of your live theme for testing (Online Store > Themes > Actions > Duplicate).
- The rebate form PDF uploaded to Shopify (Content > Files > Upload files). Note the file name (e.g., `rebate-form.pdf`).
- The "superwinch-rebate-2025" collection created with all qualifying products (Products > Collections > Create collection).

## Step 1: Add Required Libraries
1. Download Slick Slider files (`slick.min.js` and `slick.css`) from https://kenwheeler.github.io/slick/.
2. In Shopify admin, go to Online Store > Themes > Actions > Edit code.
3. In the Assets folder, upload `slick.min.js` and `slick.css`.
4. Open the `theme.liquid` file in the Layout folder.
5. In the `<head>` section, add links to include jQuery and Slick Slider:
   - Reference `slick.css` from the Assets folder.
   - Include jQuery from a CDN (e.g., `https://code.jquery.com/jquery-3.6.0.min.js`).
   - Reference `slick.min.js` from the Assets folder.

## Step 2: Create the Popup Snippet
1. In the Snippets folder, click "Add a new snippet" and name it `rebate-popup`.
2. Copy the provided popup code into `rebate-popup.liquid`. Ensure the collection handle is `superwinch-rebate-2025` and the PDF file name matches your uploaded file (e.g., `rebate-form.pdf`).
3. Save the snippet.

## Step 3: Include the Snippet in Your Theme
1. Open `theme.liquid` in the Layout folder.
2. Just before the `</body>` tag, add the include statement for the snippet.
3. To show the popup only on specific pages (e.g., homepage), wrap the include statement in a conditional (e.g., check if the template is `index`).
4. Save the file.

## Step 4: Test the Popup
1. Preview the theme in the Shopify theme editor (Online Store > Themes > Actions > Preview).
2. Verify the popup appears on page load, shows the carousel with products from the "superwinch-rebate-2025" collection, and includes working download, print, and email buttons.
3. Test the date logic by temporarily adjusting the start/end dates in the snippet to include today’s date.
4. Check responsiveness on mobile devices (carousel should adjust to show fewer items).

## Step 5: Add Rebate Form to Order Confirmation Email (Optional)
1. Go to Settings > Notifications > Order confirmation in your Shopify admin.
2. Add a conditional statement to include a link to the rebate form PDF if any purchased item is from the "superwinch-rebate-2025" collection.
3. Save the changes and test by placing an order with a qualifying item.

## Step 6: Customize and Finalize
- Adjust the popup’s styling (colors, fonts, sizes) in the inline CSS within the snippet to match your theme or the retailer’s wireframe.
- If the number of products is small, consider replacing the carousel with a static list for simplicity.
- To show the popup only once per user, add cookie logic using a library like js-cookie (upload to Assets and modify the JavaScript).
- For advanced emailing (e.g., sending the PDF as an attachment), explore Shopify apps like Klaviyo, Privy, or Shopify Flow (if on Shopify Plus).

## Notes
- Always test changes in a duplicate theme to avoid disrupting your live store.
- If the popup must match a specific wireframe from the retailer’s PDF, adjust the HTML/CSS in the snippet to reflect the design.
- The email feature uses a mailto link, which opens the user’s email client with a pre-filled message containing the PDF link. For direct emailing with attachments, integrate a third-party service like SendGrid via a private app or webhook.