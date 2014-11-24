function PopIt() { 
	var popover = document.getElementById('popover');
    
    popover.style.display = 'block';

    return "Are you sure you want to leave?"; 
	}
     function UnPopIt()  {} 
 
     $(document).ready(function() {
     	window.onbeforeunload = PopIt;
		$("a").click(function(){ window.onbeforeunload = UnPopIt; });
     });
$(function(){
    $(window).on('load', function(){
        $('#warning').delay(1400).animate({
            'top' : 0
        });
    });
    var btn = $('#btn');
    var win = $(window);
    btn.stop().on('mouseover', function(){
      $('#btn img').stop().animate({
        top: 13
      }, 100);
    });
    btn.stop().on('mouseout', function(){
      $('#btn img').stop().animate({
        top: 15
      }, 100);
    });
    btn.on('click', function(){
      $('html, body').animate({
        scrollTop: $('#wrapper').offset().top
      });
    });
    win.bind('scroll', function(){
        if(win.scrollTop() > 300){
          btn.stop().fadeIn(100);
        }else{
          btn.stop().fadeOut(100);
        }
      
    });

});
