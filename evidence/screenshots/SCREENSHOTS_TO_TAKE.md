# Screenshots to capture

Use the local Express server after `npm install`, `npm run setup`, and `npm start`. Open `http://localhost:3000` in your browser. Save screenshots here with the filenames below. The demo accounts are local seeded accounts. Use unique test shop and customer details for each run.

1. `01-login.png` — Open `http://localhost:3000/login.html`. Capture the sign-in form and demo account card before entering credentials.
2. `02-owner-dashboard.png` — Sign in with `shopowner@dukaansaathi.pk` and `Shop@12345`. Capture `http://localhost:3000/app-dashboard.html` after its summary cards load.
3. `03-khata-api-data.png` — Open `http://localhost:3000/app-khata.html` as the owner. Wait for the customer table and balances to load, then capture it.
4. `04-new-entry-persists.png` — On the Khata page, click **+ New Entry**, select a customer, enter a credit amount and note, review, and confirm. Reload the page, open the customer's ledger, and capture the new entry and balance.
5. `05-owner-access-denied.png` — Return to `http://localhost:3000/app-dashboard.html` as the owner and click **Try approving a shop (demo)**. Capture the **Access Denied** toast.
6. `06-register-pending.png` — Open `http://localhost:3000/register-shop.html`. Fill the required shop, owner, mobile, email, and password fields with unique test details and accept the declaration. Submit, then capture the Pending application card. The optional CNIC and file are checked locally and are not uploaded.
7. `07-admin-queue.png` — Sign out. Sign in with `admin@dukaansaathi.pk` and `Admin@12345`. Open `http://localhost:3000/admin-shops.html` and capture the pending shop in the approval queue. Click **Approve**.
8. `08-approved-public-shop.png` — Open `http://localhost:3000/browse-shops.html`. Search for the approved shop name and capture it in the public directory.

Keep screenshots free of passwords, full JWTs, private customer phone reveals, and personal identification numbers. Browser automation was unavailable because the browser permission for localhost was denied, so these screenshots require manual capture.
