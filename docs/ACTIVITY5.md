# Activity 5 — Secure Coding Practices

The Activity 5 frontend checks now run alongside Activity 6 server validation and authorization. Registration validates required shop and owner fields, trims names and addresses, checks mobile and email formats, and rejects angle brackets. Khata entries require a positive whole amount and a short note. Sign-in validates email and password fields. Server routes independently enforce these rules.

User supplied text in the registration status card, shop directory, admin queue, khata timeline, and toasts is rendered with DOM creation and `textContent`. The registration document selector screens the filename, extension, MIME type, and size in the browser without reading or uploading the file. The password strength helper reports Weak, Moderate, or Strong feedback. The registration form checks password confirmation before sending the password once to the API. The JWT is stored in `sessionStorage`, and logout clears that session.

## Test cases

| Feature | Input | Expected | Actual |
| --- | --- | --- | --- |
| Shop name | Whitespace only | Submission blocked | Code inspection confirms `textRule` rejects names below 3 characters; browser observation pending |
| Name normalization | Repeated inner spaces | Collapsed before storage | Server `text()` normalizes spaces; browser observation pending |
| XSS note | `<script>alert(1)</script>` | Validation rejects angle brackets | API validation code rejects angle brackets; browser observation pending |
| File type | `.exe` or `file.exe.png` | Selection rejected | Client extension rule inspected; browser observation pending |
| File size | 3 MB PDF | Selection rejected | Client 2 MB limit inspected; browser observation pending |
| File type | Valid `.png` with `image/png` | Accepted locally | Client MIME rule inspected; browser observation pending |
| Password feedback | Short, medium, long varied passwords | Weak, Moderate, Strong | Helper outputs verified with a local JavaScript harness; browser observation pending |
| Storage | Login then logout | Token present, then session empty | `DS_AUTH.logout` clears sessionStorage; browser observation pending |

Frontend checks help users correct inputs. The server validates and authorizes every API request. Browser observation remains pending because the saved browser permission blocks localhost access.
