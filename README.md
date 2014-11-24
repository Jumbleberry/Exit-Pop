Exit-Pop
========

### Demos
##### Simple HTML Demo: [Click Here](http://jumbleberry.github.io/Exit-Pop/)

##### Landing Page Demo: [Click Here](http://jumbleberry.github.io/Exit-Pop/demo/index.html)


### Usage
```
$.exitpop({
	predict_amt: 0.02,
	fps: 300,
	popCount: 1,
	tolerance: {x: 10, y: 10},
	cta: "",
	callback: function() {
		$('#exitpop').show();
	}
})
```

###Configuration Options

#### predict_amt
`default: 0.02`

Defines how many seconds into the future we will try to predict mouse movement. `0.02` Means we will try to guess where the users mouse will be `0.02` seconds from now. This should be a low value, since the users behaviour can be unpredictable.

#### fps
`default: 300`

How often we sample the users position, to determine if they have exit intent. The higher the value, the more resources are consumed. However, if this value is low, very quick mouse movements happen between measurement cycles and some exit intents might not be identified.

#### tolerance
`default: {x: 10, y:10}`

A `%` based tolerance. For instance, a tolerance of `{x: 10}` means that if a users cursor is within 10% of the width of the CTA (call to action) away from that element, we treat it the same as if they were actually on the element. This is useful for preventing firing exit intent events when a user slightly overshoots the position of a CTA.

#### cta
`default: ""`

A string, which should contain jQuery selectors for all the CTA (call to action) elements on the page. When the user is interacting with CTA elements, we will not fire exit intent events.

Ex: `cta: "form, #upsell"`

#### callback
`default: function() {}`

A javascript function, which gets called once an exit intent is identified. This should be a function which triggers the overlay or exit pop.

#### popCount
`default: 1`

How many times we will fire the exit pop. Every time a user has exit intent, the popCount is decremented. Thus, if a user closes the exit pop, and attempts to leave again, a popCount value higher than 1 would cause the exit pop to deploy again.