$(document).ready(function () {
    const API_URL = '/api';


    $('.toggle-password').on('click', function () {
        const passwordInput = $(this).siblings('input');
        const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        passwordInput.attr('type', type);
        $(this).text(type === 'password' ? 'Show' : 'Hide');


        if (type === 'text') {
            passwordInput.addClass('password-input');
        } else {
            passwordInput.removeClass('password-input');
        }
    });


    function showToast(message, isError = false) {
        const toastEl = $('#liveToast');
        $('#toast-message').text(message);

        if (isError) {
            toastEl.removeClass('bg-primary').addClass('bg-danger');
        } else {
            toastEl.removeClass('bg-danger').addClass('bg-primary');
        }

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }


    $('#signup-form').on('submit', function (e) {
        e.preventDefault();

        const fullname = $('#fullname').val();
        const email = $('#email').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirm-password').val();

        if (password !== confirmPassword) {
            showToast('Passwords do not match!', true);
            return;
        }


        $.ajax({
            url: `${API_URL}/signup`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ fullname, email, password }),
            success: function (response) {
                showToast(response.message);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            },
            error: function (xhr) {
                let errorMsg = 'Signup failed';
                if (xhr.status === 0) {
                    errorMsg = 'Cannot connect to server. Please ensure the backend is running.';
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showToast(errorMsg, true);
            }
        });
    });


    $('#login-form').on('submit', function (e) {
        e.preventDefault();

        const email = $('#email').val();
        const password = $('#password').val();

        $.ajax({
            url: `${API_URL}/login`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function (response) {
                showToast(`Welcome back, ${response.user.fullname}!`);
                localStorage.setItem('currentUser', JSON.stringify(response.user));

                setTimeout(() => {
                    if (response.user.role === 'admin') {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/index.html';
                    }
                }, 1000);
            },
            error: function (xhr) {
                let errorMsg = 'Login failed';
                if (xhr.status === 0) {
                    errorMsg = 'Cannot connect to server. Please ensure the backend is running.';
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showToast(errorMsg, true);
            }
        });
    });



});
