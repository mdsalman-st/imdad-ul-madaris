const slides = document.querySelectorAll('.slide');
let currentIndex = 0;

setInterval(() => {
  slides[currentIndex].classList.remove('active');
  currentIndex = (currentIndex + 1) % slides.length;
  slides[currentIndex].classList.add('active');
}, 5000);


const images = document.querySelectorAll('.hero img');
let current = 0;

setInterval(() => {
  images[current].classList.remove('active');
  current = (current + 1) % images.length;
  images[current].classList.add('active');
}, 5000);
