# Frontend and backend request evidence

The real Express server served the existing HTML pages and received the same API calls their JavaScript makes. This trace was generated through HTTP requests, so it does not claim a browser rendering or console check.

The sequence loaded login.html, signed in as the owner, loaded the owner dashboard and khata page, fetched customers, added and retrieved an entry, loaded register-shop.html, registered a pending shop, loaded the admin queue, approved the shop, and fetched the public directory.

The separate API evidence file contains redacted request and response bodies. The access log records method, path, status, and elapsed milliseconds without credentials or request bodies.

Requests recorded: 28.
