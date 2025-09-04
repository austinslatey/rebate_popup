document.addEventListener('DOMContentLoaded', function () {
    // Show popup after 5 seconds
    setTimeout(function () {
        document.getElementById('state-fair-popup').style.display = 'flex';
    }, 5000);

    // Close popup on click
    document.querySelector('.close-popup').addEventListener('click', function () {
        document.getElementById('state-fair-popup').style.display = 'none';
    });

    // Close popup when clicking outside
    document.getElementById('state-fair-popup').addEventListener('click', function (e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // Prevent multiple popups
    if (!sessionStorage.getItem('popupShown')) {
        document.getElementById('state-fair-popup').style.display = 'flex';
        sessionStorage.setItem('popupShown', 'true');
    }
});