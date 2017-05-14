(function($) {
    
    // CONSTANTS
    var opts = {
            predict_amt: 0.02,
            fps: 300,
            delay: 500,
            tolerance: {x: 10, y: 10},
            cta: "",
            callback: function() {},
            popCount: 1
        },
        animationHandle,
        doc     = document.documentElement,
        onPage  = true,
        bounds  = [],
        init    = false,
        offsetX = 0,
        offsetY = 0,
        xPos    = 1000,
        yPos    = 1000,
        lastX   = xPos,
        lastY   = yPos,
        A       = $M([
            [1, 0, 0.2, 0],
            [0, 1, 0, 0.2],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]),
        B       = $M([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]),
        H       = $M([
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]),
        Q       = $M([
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0.1, 0],
            [0, 0, 0, 0.1]
        ]),
        R       = $M([
            [0.1, 0, 0, 0],
            [0, 0.1, 0, 0],
            [0, 0, 0.1, 0],
            [0, 0, 0, 0.1]
        ]),
        last_x  = $V([0, 0, 0, 0]),
        last_P  = $M([
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]),
        throttle = function throttle(fn, threshhold, scope, dontFireFirst) {
          threshhold || (threshhold = 250);
          var last,
              deferTimer;
          return function () {
            var context = scope || this;
        
            var now = +new Date,
                args = arguments;
            
            if (dontFireFirst && !last)
                last = now;
            
            if (deferTimer)
                return;
            
            if (last) {
              // hold on to it
              clearTimeout(deferTimer);
              deferTimer = setTimeout(function () {
                last        = now;
                deferTimer  = null;
                fn.apply(context, args);
              }, threshhold);
            } else {
              last = now;
              fn.apply(context, args);
            }
          };
        },
        // Trigger the user defined callback function
        callback = function() {
            if (onPage)
                return;
            
            if (opts.popCount)
                opts.popCount--;
            
            stop();
            opts.callback();
        },
        // Estimate where the cursor is heading
        interpolate = function() {
            // introduce some noise (if set)
            cur_xPos        = xPos;
            cur_yPos        = yPos;
            
            var velX        = cur_xPos - last_x.elements[0];
            var velY        = cur_yPos - last_x.elements[1];
        
            var measurement = $V([cur_xPos, cur_yPos, velX, velY]);
            var control     = $V([0, 0, 0, 0]);
        
            // prediction
            var x           = (A.multiply(last_x)).add(B.multiply(control));
            var P           = ((A.multiply(last_P)).multiply(A.transpose())).add(Q); 
        
            // correction
            var S           = ((H.multiply(P)).multiply(H.transpose())).add(R);
            var K           = (P.multiply(H.transpose())).multiply(S.inverse());
            var y           = measurement.subtract(H.multiply(x));
        
            var cur_x       = x.add(K.multiply(y));
            var cur_P       = ((Matrix.I(4)).subtract(K.multiply(H))).multiply(P);
        
            last_x          = cur_x;
            last_P          = cur_P;
            
            // run prediction for n cycles:
            var pred = last_x;
            var count = Math.round(opts.fps * opts.predict_amt);
            
            // Extrapolate future position
            for (var i = 0; i < count; i++ )
                pred = (A.multiply(pred)).add(B.multiply(control));
            
            checkExit({x: lastX, y: lastY}, {x: cur_xPos, y: cur_yPos}, {x: pred.elements[0], y: pred.elements[1]});
        },
        // check if a line intersects a bounding rectangle
        intersects = function(start, end, rect) {
            var p1x       = start.x;
            var p2x       = end.x;
            var rectX     = rect.x - offsetX;
            var rectWidth = rect.width;
            
            // check if the projections onto the x axis overlap
            if (p1x < p2x && (rectX > p2x || rectX + rectWidth < p1x) || (rectX > p1x || rectX + rectWidth < p2x))
              return false;
            
            var p1y           = start.y;
            var p2y           = end.y;
            var rectY         = rect.y - offsetY;
            var rectHeight    = rect.height;
            
            // check if the projections onto the y axis overlap
            if (p1y < p2y && (rectY > p2y || rectY + rectHeight < p1y) || (rectY > p1y || rectY + rectHeight < p2y))
              return false;
            
            var a = p2y - p1y;
            var b = p1x - p2x;
            var c = p2x * p1y - p1x * p2y;
            var bottomLeft = rectX * a + rectY * b + c;
            
            var isNegative = bottomLeft < 0;
            
            var aWidth  = a * rectWidth;
            var x       = bottomLeft + aWidth;
            
            if (isNegative !== x < 0)
              return true;
            
            var bHeight = b * rectHeight;
            var y       = bottomLeft + bHeight;
            
            if (isNegative !== y < 0)
              return true;
            
            var z = y + aWidth;
            
            if (isNegative !== z < 0) 
              return true;
            
            if (!(bottomLeft && x && y && z))
              return true;
            
            // all 4 of the rectangles corners are on the same side of the line
            return false;
        },
        // Check if the users cursor left the page, and that the cursor path wasn't intersecting with a call to action
        checkExit = function(start, end, pred) {
            
            var hasIntersect = false,
                safeEnd      = { x: Math.max(0, pred.x), y: Math.max(0, pred.y) };
            
            $.each(bounds, function(i, v) {
                if (intersects(end, safeEnd, bounds[i]))
                    hasIntersect = true;
            });
            
            // Intersection with call to action found, don't exit yet
            if (hasIntersect)
                return;
            
            // Cursor left the page, the mouse is moving upwards, and quick enough to exit the page from the top
            if ((end.y - start.y) < 0 && (yPos - ((start.y - end.y) * 2)) < 0) {
                opts.callbackThrottle();
            
            // User is intending to leave the page - this fixes a chrome bug where mouseleave isnt fired when mouse moves slowly
            // Cursor has to be moving upwards off of the page, and had to have already hovered over the page
            } else if (onPage === true && end.y > 0 && end.y < 5 && end.y < start.y) {
                onPage = false;
                opts.callbackThrottle();
                
            } else if (onPage === false && end.y >= 5) {
                onPage = true;
            }
        };
    
    $.exitpop = function (options) {
        
        bounds                  = [];
        opts                    = $.extend(opts, options || {});
        opts.callbackThrottle   = throttle(callback, opts.delay, null, true);
        
        // Get coords of all calls to actions
        $.each($(opts.cta), function(i, v) {
            var $v = $(v), o = $v.offset(), h = $v.outerHeight(), w = $v.outerWidth(), xn = opts.tolerance.x / 100, yn = opts.tolerance.y / 100;
            bounds.push({x: Math.max(0, o.left - (w * xn)), y: Math.max(0, o.top - (h * yn)), height: (h * (1 + 2*yn)), width: (w * (1 + 2*xn))});
        });
        
        if (!init) {
            init = true;
            
            // Track mouse coordinates
            $(document).mousemove(function(event) {
                if (opts.popCount <= 0)
                    return;
                
                if (onPage == undefined)
                    onPage = true;
                
                lastX   = xPos;
                lastY   = yPos;
                
                offsetX = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
                offsetY = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
                
                xPos    = (event.pageX || 1000) - offsetX;
                yPos    = (event.pageY || 1000) - offsetY;
                
                throttle(interpolate, 1000/opts.fps)();
            }).mousemove();
            
            // Track whether or not the cursor is on the page
            $(document).mouseleave(function(event) {
                onPage = false;
                
            }).mouseenter(function(event) {
                onPage = true;
                
            });
        }
        
        return this;
    };
    
}(jQuery));