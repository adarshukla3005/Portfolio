 AOS.init({
 	duration: 800,
 	easing: 'slide'
 });

(function($) {

	"use strict";

	$(window).stellar({
    responsive: true,
    parallaxBackgrounds: true,
    parallaxElements: true,
    horizontalScrolling: false,
    hideDistantElements: false,
    scrollProperty: 'scroll'
  });


	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	// loader
	var loader = function() {
		setTimeout(function() { 
			if($('#ftco-loader').length > 0) {
				$('#ftco-loader').removeClass('show');
			}
		}, 1);
	};
	loader();

	// Scrollax
   $.Scrollax();



   // Burger Menu
	var burgerMenu = function() {

		$('body').on('click', '.js-fh5co-nav-toggle', function(event){

			event.preventDefault();

			if ( $('#ftco-nav').is(':visible') ) {
				$(this).removeClass('active');
			} else {
				$(this).addClass('active');	
			}

			
			
		});

	};
	burgerMenu();


	var onePageClick = function() {


		$(document).on('click', '#ftco-nav a[href^="#"]', function (event) {
	    event.preventDefault();

	    var href = $.attr(this, 'href');

	    $('html, body').animate({
	        scrollTop: $($.attr(this, 'href')).offset().top - 70
	    }, 500, function() {
	    	// window.location.hash = href;
	    });
		});

	};

	onePageClick();
	

	var carousel = function() {
		$('.home-slider').owlCarousel({
	    loop:true,
	    autoplay: true,
	    margin:0,
	    animateOut: 'fadeOut',
	    animateIn: 'fadeIn',
	    nav:false,
	    autoplayHoverPause: false,
	    items: 1,
	    navText : ["<span class='ion-md-arrow-back'></span>","<span class='ion-chevron-right'></span>"],
	    responsive:{
	      0:{
	        items:1
	      },
	      600:{
	        items:1
	      },
	      1000:{
	        items:1
	      }
	    }
		});
	};
	carousel();

	$('nav .dropdown').hover(function(){
		var $this = $(this);
		// 	 timer;
		// clearTimeout(timer);
		$this.addClass('show');
		$this.find('> a').attr('aria-expanded', true);
		// $this.find('.dropdown-menu').addClass('animated-fast fadeInUp show');
		$this.find('.dropdown-menu').addClass('show');
	}, function(){
		var $this = $(this);
			// timer;
		// timer = setTimeout(function(){
			$this.removeClass('show');
			$this.find('> a').attr('aria-expanded', false);
			// $this.find('.dropdown-menu').removeClass('animated-fast fadeInUp show');
			$this.find('.dropdown-menu').removeClass('show');
		// }, 100);
	});


	$('#dropdown04').on('show.bs.dropdown', function () {
	  console.log('show');
	});

	// scroll
	var scrollWindow = function() {
		$(window).scroll(function(){
			var $w = $(this),
					st = $w.scrollTop(),
					navbar = $('.ftco_navbar'),
					sd = $('.js-scroll-wrap');

			if (st > 150) {
				if ( !navbar.hasClass('scrolled') ) {
					navbar.addClass('scrolled');	
				}
			} 
			if (st < 150) {
				if ( navbar.hasClass('scrolled') ) {
					navbar.removeClass('scrolled sleep');
				}
			} 
			if ( st > 350 ) {
				if ( !navbar.hasClass('awake') ) {
					navbar.addClass('awake');	
				}
				
				if(sd.length > 0) {
					sd.addClass('sleep');
				}
			}
			if ( st < 350 ) {
				if ( navbar.hasClass('awake') ) {
					navbar.removeClass('awake');
					navbar.addClass('sleep');
				}
				if(sd.length > 0) {
					sd.removeClass('sleep');
				}
			}
		});
	};
	scrollWindow();

	

	var counter = function() {
		
		$('#section-counter, .hero-wrap, .ftco-counter, .ftco-about').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {

				var comma_separator_number_step = $.animateNumber.numberStepFactories.separator(',')
				$('.number').each(function(){
					var $this = $(this),
						num = $this.data('number');
						console.log(num);
					$this.animateNumber(
					  {
					    number: num,
					    numberStep: comma_separator_number_step
					  }, 7000
					);
				});
				
			}

		} , { offset: '95%' } );

	}
	counter();


	var contentWayPoint = function() {
		var i = 0;
		$('.ftco-animate').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {
				
				i++;

				$(this.element).addClass('item-animate');
				setTimeout(function(){

					$('body .ftco-animate.item-animate').each(function(k){
						var el = $(this);
						setTimeout( function () {
							var effect = el.data('animate-effect');
							if ( effect === 'fadeIn') {
								el.addClass('fadeIn ftco-animated');
							} else if ( effect === 'fadeInLeft') {
								el.addClass('fadeInLeft ftco-animated');
							} else if ( effect === 'fadeInRight') {
								el.addClass('fadeInRight ftco-animated');
							} else {
								el.addClass('fadeInUp ftco-animated');
							}
							el.removeClass('item-animate');
						},  k * 50, 'easeInOutExpo' );
					});
					
				}, 100);
				
			}

		} , { offset: '95%' } );
	};
	contentWayPoint();

	// magnific popup
	$('.image-popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    fixedContentPos: true,
    mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
     gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      verticalFit: true
    },
    zoom: {
      enabled: true,
      duration: 300 // don't foget to change the duration also in CSS
    }
  });

  $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
    disableOn: 700,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,

    fixedContentPos: false
  });





})(jQuery);

// Animate skill bars when they come into view
document.addEventListener('DOMContentLoaded', function() {
  const skillBars = document.querySelectorAll('.progress-value');
  
  if (skillBars.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Get the width from the style attribute
          const width = entry.target.style.width;
          
          // Remove the class first (if it already has it)
          entry.target.classList.remove('animate-skill');
          
          // Force a reflow
          void entry.target.offsetWidth;
          
          // Add the animation class back
          entry.target.classList.add('animate-skill');
          
          // Unobserve after animation is triggered
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2 // Trigger when 20% of the element is visible
    });
    
    // Observe each skill bar
    skillBars.forEach(bar => {
      observer.observe(bar);
    });
  }
});

// Add a scroll reveal animation for the cards
document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.card');
  
  if (cards.length) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Use a more pronounced animation
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 150); // Increase delay between cards for more visible staggered effect
          
          // Trigger project tag animation after card appears
          const tag = entry.target.querySelector('.project-tag');
          if (tag) {
            setTimeout(() => {
              tag.style.opacity = '1';
              tag.style.transform = 'translateY(0)';
            }, index * 150 + 300);
          }
          
          cardObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px' // Trigger slightly before card comes into full view
    });
    
    // Set initial styles and observe cards
    cards.forEach((card) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(50px)';
      card.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      
      // Also set styles for project tags
      const tag = card.querySelector('.project-tag');
      if (tag) {
        tag.style.opacity = '0';
        tag.style.transform = 'translateY(-10px)';
        tag.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        tag.style.transitionDelay = '0.2s';
      }
      
      cardObserver.observe(card);
    });
    
    // Add hover effect for GitHub buttons
    const githubButtons = document.querySelectorAll('.github-btn');
    githubButtons.forEach(btn => {
      btn.addEventListener('mouseover', function() {
        this.innerHTML = '<i class="icon-github mr-1"></i> View Code';
      });
      
      btn.addEventListener('mouseout', function() {
        this.innerHTML = '<i class="icon-github mr-1"></i> GitHub';
      });
    });
  }
});

// Project filtering functionality
document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.project-filters a');
  const techStackButtons = document.querySelectorAll('.tech-stack-filters a');
  const projectCards = document.querySelectorAll('.card');
  
  // Add classes to project cards based on their tags
  projectCards.forEach(card => {
    const tag = card.querySelector('.project-tag');
    if (tag) {
      const tagText = tag.textContent.trim().toLowerCase();
      
      if (tagText === 'ai/ml') {
        card.parentElement.classList.add('ai-ml');
        card.parentElement.classList.add('tech-ai'); // Add AI tech class
        card.parentElement.classList.add('tech-python'); // Most AI/ML projects use Python
      } else if (tagText === 'nlp') {
        card.parentElement.classList.add('nlp');
        card.parentElement.classList.add('tech-nlp'); // Add NLP tech class
        card.parentElement.classList.add('tech-python'); // NLP projects use Python
      } else if (tagText === 'ml') {
        card.parentElement.classList.add('ai-ml');
        card.parentElement.classList.add('tech-ai'); // Add AI tech class
        card.parentElement.classList.add('tech-python'); // ML projects use Python
      } else if (tagText === 'deep learning') {
        card.parentElement.classList.add('ai-ml');
        card.parentElement.classList.add('tech-ai'); // Add AI tech class
        card.parentElement.classList.add('tech-python'); // Deep learning uses Python
      } else if (tagText === 'computer vision') {
        card.parentElement.classList.add('vision');
        card.parentElement.classList.add('tech-ai'); // Computer vision is AI
        card.parentElement.classList.add('tech-python'); // Computer vision uses Python
      } else if (tagText === 'full stack') {
        card.parentElement.classList.add('fullstack');
        card.parentElement.classList.add('tech-automation'); // Full stack can include automation
      }
    }
    
    // Add additional tech classes based on project descriptions
    const techDescription = card.querySelector('.text-muted');
    if (techDescription) {
      const techText = techDescription.textContent.trim().toLowerCase();
      
      if (techText.includes('nlp') || techText.includes('natural language processing')) {
        card.parentElement.classList.add('tech-nlp');
      }
      
      if (techText.includes('python')) {
        card.parentElement.classList.add('tech-python');
      }
      
      if (techText.includes('automation')) {
        card.parentElement.classList.add('tech-automation');
      }
      
      if (techText.includes('ai') || techText.includes('artificial intelligence')) {
        card.parentElement.classList.add('tech-ai');
      }
    }
  });
  
  // Add click event listeners to main filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all buttons
      filterButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Reset tech stack filters
      techStackButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Get filter value
      const filter = this.getAttribute('data-filter');
      
      // Filter projects
      if (filter === '*') {
        // Show all projects
        projectCards.forEach(card => {
          card.parentElement.style.display = 'block';
          setTimeout(() => {
            card.parentElement.style.opacity = '1';
            card.parentElement.style.transform = 'scale(1)';
          }, 50);
        });
      } else {
        // Filter projects by class
        projectCards.forEach(card => {
          if (card.parentElement.classList.contains(filter.replace('.', ''))) {
            card.parentElement.style.display = 'block';
            setTimeout(() => {
              card.parentElement.style.opacity = '1';
              card.parentElement.style.transform = 'scale(1)';
            }, 50);
          } else {
            card.parentElement.style.opacity = '0';
            card.parentElement.style.transform = 'scale(0.8)';
            setTimeout(() => {
              card.parentElement.style.display = 'none';
            }, 300);
          }
        });
      }
    });
  });
  
  // Tech stack filtering
  techStackButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Toggle active class on clicked button
      this.classList.toggle('active');
      
      // Get all active tech filters
      const activeTechs = Array.from(document.querySelectorAll('.tech-stack-filters a.active'))
        .map(el => `tech-${el.getAttribute('data-tech')}`);
      
      // If no tech filters are active, show all projects
      if (activeTechs.length === 0) {
        // Reset to show according to the main filter
        const activeMainFilter = document.querySelector('.project-filters a.active');
        const mainFilter = activeMainFilter ? activeMainFilter.getAttribute('data-filter') : '*';
        
        if (mainFilter === '*') {
          projectCards.forEach(card => {
            card.parentElement.style.display = 'block';
            setTimeout(() => {
              card.parentElement.style.opacity = '1';
              card.parentElement.style.transform = 'scale(1)';
            }, 50);
          });
        } else {
          projectCards.forEach(card => {
            if (card.parentElement.classList.contains(mainFilter.replace('.', ''))) {
              card.parentElement.style.display = 'block';
              setTimeout(() => {
                card.parentElement.style.opacity = '1';
                card.parentElement.style.transform = 'scale(1)';
              }, 50);
            } else {
              card.parentElement.style.opacity = '0';
              card.parentElement.style.transform = 'scale(0.8)';
              setTimeout(() => {
                card.parentElement.style.display = 'none';
              }, 300);
            }
          });
        }
        return;
      }
      
      // Filter projects by active tech filters
      projectCards.forEach(card => {
        // Check if card has all active tech classes
        const hasAllTechs = activeTechs.every(tech => 
          card.parentElement.classList.contains(tech)
        );
        
        if (hasAllTechs) {
          card.parentElement.style.display = 'block';
          setTimeout(() => {
            card.parentElement.style.opacity = '1';
            card.parentElement.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.parentElement.style.opacity = '0';
          card.parentElement.style.transform = 'scale(0.8)';
          setTimeout(() => {
            card.parentElement.style.display = 'none';
          }, 300);
        }
      });
    });
  });
});

