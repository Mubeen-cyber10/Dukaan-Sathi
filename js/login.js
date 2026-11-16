const form = document.getElementById('login-form');
const email = document.getElementById('login-email');
const password = document.getElementById('login-password');
const submit = document.getElementById('btn-login-submit');
const generalError = document.getElementById('general-error');
const generalErrorText = document.getElementById('general-error-text');
const notices = {
  signin: 'Access denied - please sign in',
  denied: 'Access denied: insufficient permissions',
  logout: 'You have been logged out successfully.',
  idle: 'Session expired due to inactivity.',
  unavailable: 'Could not verify your session. Please try again.'
};
const url = new URL(location.href);
const notice = url.searchParams.get('notice');
if (Object.hasOwn(notices, notice)) {
  showToast(notices[notice], notice === 'logout' ? 'primary' : 'danger');
  history.replaceState(null, '', url.pathname);
}

let deadline = 0;
let countdown;
function setDisabled(disabled) {
  for (const control of [email, password, submit, ...document.querySelectorAll('.demo-fill-btn')]) {
    control.disabled = disabled;
  }
}
function showLockout(seconds) {
  deadline = Date.now() + seconds * 1000;
  function update() {
    const remaining = Math.ceil((deadline - Date.now()) / 1000);
    if (remaining > 0) {
      generalErrorText.textContent = 'Too many attempts. Try again in ' + remaining + 's.';
    } else {
      clearInterval(countdown);
      generalError.classList.add('hidden');
      setDisabled(false);
    }
  }
  setDisabled(true);
  update();
  countdown = setInterval(update, 1000);
}

document.querySelectorAll('.demo-fill-btn').forEach(button => {
  button.addEventListener('click', () => {
    email.value = button.dataset.email;
    password.value = button.dataset.pass;
    generalError.classList.add('hidden');
  });
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  const validEmail = email.validity.valid;
  const hasPassword = Boolean(password.value);
  document.getElementById('email-error').classList.toggle('hidden', validEmail);
  document.getElementById('password-error').classList.toggle('hidden', hasPassword);
  if (!validEmail || !hasPassword) return;

  generalError.classList.add('hidden');
  setDisabled(true);
  submit.classList.add('btn--loading');
  submit.textContent = 'Signing in…';
  try {
    location.assign(await DS_AUTH.login(email.value.trim(), password.value));
  } catch (error) {
    generalError.classList.remove('hidden');
    generalErrorText.textContent = error.message;
    if (error.status === 429 && error.retryAfter > 0) showLockout(error.retryAfter);
  } finally {
    password.value = '';
    submit.classList.remove('btn--loading');
    submit.textContent = 'Authenticate & Continue →';
    if (Date.now() >= deadline) setDisabled(false);
  }
});

const forgot = document.getElementById('modal-forgot-backdrop');
document.getElementById('btn-forgot-password').addEventListener('click', () => forgot.classList.add('modal-backdrop--open'));
for (const id of ['modal-forgot-close', 'modal-forgot-ok']) {
  document.getElementById(id).addEventListener('click', () => forgot.classList.remove('modal-backdrop--open'));
}
