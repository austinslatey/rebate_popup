document.addEventListener('DOMContentLoaded', function() {
  var modal = document.getElementById('rebateModal');
  if (modal) {
    // Show popup on page load (you can add cookie logic to show only once)
    modal.style.display = 'block';
    
    // Initialize Slick carousel
    $('.rebate-carousel').slick({
      slidesToShow: 3, // Adjust based on item count
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 3000,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1
          }
        }
      ]
    });
  }
});

// Email function (mailto workaround)
function sendEmail(event) {
  event.preventDefault();
  var email = document.getElementById('userEmail').value;
  var pdfUrl = '{{ 'rebate-form.pdf' | file_url }}';
  var subject = 'Your Rebate Form';
  var body = 'Download your rebate form here: ' + pdfUrl + '\n\nPrint and complete it to claim your cash back.';
  window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}