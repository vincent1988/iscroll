/*! iScroll v5.1.3 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license */
(function (window, document, Math) {
	/**
	 * window.requestAnimationFrame()这个方法是用来在页面重绘之前，通知浏览器调用一个指定的函数，以满足开发者操作动画的需求。这个方法接受一个函数为参，该函数会在重绘前调用。
	 *注意: 如果想得到连贯的逐帧动画，函数中必须重新调用 requestAnimationFrame()。
	 * @type {window.requestAnimationFrame|*|Function}
	 */
var rAF = window.requestAnimationFrame	||
	window.webkitRequestAnimationFrame	||
	window.mozRequestAnimationFrame		||
	window.oRequestAnimationFrame		||
	window.msRequestAnimationFrame		||
	function (callback) { window.setTimeout(callback, 1000 / 60); };
	/**
	 * 工具类 函数
	 */
var utils = (function () {
	//命名空间：将需要暴露给外界调用的方法放在me对象中，其他var生命的方法则保持为私有
	var me = {};
		/**
		 * 用于判断浏览器是否支持相关的css3属性
		 * @type {CSSStyleDeclaration}
		 * @private
		 */
	var _elementStyle = document.createElement('div').style;
		/**
		 *判断CSS属性样式前缀
		 * 返回'',webkit,Moz,ms,O   或者 false
		 */
	var _vendor = (function () {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;

		for ( ; i < l; i++ ) {
			transform = vendors[i] + 'ransform';
			if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
		}

		return false;
	})();

		/**
		 * 获取CSS 前缀
		 * @param style
		 * @returns {*}
		 * @private
		 */
	function _prefixStyle (style) {
		if ( _vendor === false ) return false;
		if ( _vendor === '' ) return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}
		/**
		 * 获取当前时间戳
		 * @type {*|Function}
		 */
	me.getTime = Date.now || function getTime () { return new Date().getTime(); };
		/**
		 * 扩展方法
		 * @param target
		 * @param obj
		 */
	me.extend = function (target, obj) {
		for ( var i in obj ) {
			target[i] = obj[i];
		}
	};
		/**
		 *
		 * @param el
		 * @param type
		 * @param fn
		 * @param capture   是否捕获
		 * useCapture，是一個boolean值，就是true or false 。如果送出true的話就是瀏覽器會使用Capture方式，false的話是Bubbling，只有在特定狀況下才會有影響，通常建議是false
		 */
	me.addEvent = function (el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	};

	me.removeEvent = function (el, type, fn, capture) {
		el.removeEventListener(type, fn, !!capture);
	};
		/**
		 * 适配
		 * @param pointerEvent
		 * @returns {*}
		 */
	me.prefixPointerEvent = function (pointerEvent) {
		return window.MSPointerEvent ? 
			'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10):
			pointerEvent;
	};
		/**
		 * 根据拖动返回运动的长度和耗时，用户惯性拖动的判断
		 * @param current
		 * @param start
		 * @param time
		 * @param lowerMargin
		 * @param wrapperSize
		 * @param deceleration
		 * @returns {{destination: number, duration: (number|*)}}
		 */
	me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
		var distance = current - start,//拖动距离
			speed = Math.abs(distance) / time,//拖动平均速度
			destination,
			duration;//持续时间

		deceleration = deceleration === undefined ? 0.0006 : deceleration;

		destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
		duration = speed / deceleration;

		if ( destination < lowerMargin ) {
			destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
			distance = Math.abs(destination - current);
			duration = distance / speed;
		} else if ( destination > 0 ) {
			destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
			distance = Math.abs(current) + destination;
			duration = distance / speed;
		}

		return {
			destination: Math.round(destination),
			duration: duration
		};
	};

	var _transform = _prefixStyle('transform');
		/**
		 * 扩展me，增加一些相关属性
 		 */
	me.extend(me, {
		hasTransform: _transform !== false,
		hasPerspective: _prefixStyle('perspective') in _elementStyle,
		hasTouch: 'ontouchstart' in window,
		hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
		hasTransition: _prefixStyle('transition') in _elementStyle
	});

	// This should find all Android browsers lower than build 535.19 (both stock browser and webview)
	me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));

	me.extend(me.style = {}, {
		transform: _transform,
		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
		transitionDuration: _prefixStyle('transitionDuration'),
		transitionDelay: _prefixStyle('transitionDelay'),
		transformOrigin: _prefixStyle('transformOrigin')
	});

	me.hasClass = function (e, c) {
		var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
		return re.test(e.className);
	};

	me.addClass = function (e, c) {
		if ( me.hasClass(e, c) ) {
			return;
		}
		//先将存在的转为数组，添加后由数组转为字符串
		var newclass = e.className.split(' ');
		newclass.push(c);
		e.className = newclass.join(' ');
	};

	me.removeClass = function (e, c) {
		if ( !me.hasClass(e, c) ) {
			return;
		}

		var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
		e.className = e.className.replace(re, ' ');
	};
		/**
		 * 返回元素距左、上的距离
		 * @param el
		 * @returns {{left: number, top: number}}
		 */
	me.offset = function (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;

		// jshint -W084
		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}
		// jshint +W084

		return {
			left: left,
			top: top
		};
	};
		/**
		 *
		 * @param el
		 * @param exceptions
		 * @returns {boolean}
		 */
	me.preventDefaultException = function (el, exceptions) {
		for ( var i in exceptions ) {
			if ( exceptions[i].test(el[i]) ) {
				return true;
			}
		}

		return false;
	};
		/**
		 * 扩展me的eventType
		 */
	me.extend(me.eventType = {}, {
		touchstart: 1,
		touchmove: 1,
		touchend: 1,

		mousedown: 2,
		mousemove: 2,
		mouseup: 2,

		pointerdown: 3,
		pointermove: 3,
		pointerup: 3,

		MSPointerDown: 3,
		MSPointerMove: 3,
		MSPointerUp: 3
	});
		/**
		 * 动画函数
		 * style为css3调用
		 * fn为js调用
		 */
	me.extend(me.ease = {}, {
		quadratic: {
			style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			fn: function (k) {
				return k * ( 2 - k );
			}
		},
		circular: {
			style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
			fn: function (k) {
				return Math.sqrt( 1 - ( --k * k ) );
			}
		},
		back: {
			style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			fn: function (k) {
				var b = 4;
				return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
			}
		},
		bounce: {
			style: '',
			fn: function (k) {
				if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
					return 7.5625 * k * k;
				} else if ( k < ( 2 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
				} else if ( k < ( 2.5 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
				} else {
					return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
				}
			}
		},
		elastic: {
			style: '',
			fn: function (k) {
				var f = 0.22,
					e = 0.4;

				if ( k === 0 ) { return 0; }
				if ( k == 1 ) { return 1; }

				return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
			}
		}
	});
		/**
		 * 模拟tap事件
		 * @param e
		 * @param eventName
		 */
	me.tap = function (e, eventName) {
		var ev = document.createEvent('Event');
		ev.initEvent(eventName, true, true);
		ev.pageX = e.pageX;
		ev.pageY = e.pageY;
		e.target.dispatchEvent(ev);
	};
		/**
		 * 模拟点击事件
		 * @param e
		 */
	me.click = function (e) {
		var target = e.target,
			ev;

		if ( !(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName) ) {
			ev = document.createEvent('MouseEvents');
			ev.initMouseEvent('click', true, true, e.view, 1,
				target.screenX, target.screenY, target.clientX, target.clientY,
				e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
				0, null);

			ev._constructed = true;
			target.dispatchEvent(ev);
		}
	};

	return me;
})();

function IScroll (el, options) {
	//wrapper是iScroll的容器
	this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
	//iScroll的滚动元素
	this.scroller = this.wrapper.children[0];
	//scroller的Style对象，通过set它的属性改变样式
	this.scrollerStyle = this.scroller.style;		// cache style for better performance
	//初始化参数
	this.options = {

// INSERT POINT: OPTIONS 

		startX: 0,
		startY: 0,
		//默认是Y轴上下滚动
		scrollY: true,
		//方向锁定阀值，用户点击屏幕后，滑动5px的距离后，判断用户的拖动意图
		directionLockThreshold: 5,
		//是否有惯性缓冲动画
		momentum: true,
		//超出边界是否还能拖动
		bounce: true,
		//超出边界还原时间点
		bounceTime: 600,
		//超出边界返回的动画
		bounceEasing: '',
		//是否阻止默认滚动事件
		preventDefault: true,
		//当遇到表单元素则不阻止冒泡，而是弹出系统自带相应的输入控件
		preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },
		//
		HWCompositing: true,
		useTransition: true,
		useTransform: true
	};
	//合并配置参数
	for ( var i in options ) {
		this.options[i] = options[i];
	}

	// Normalize options
	/**
	 * 判断是否支持3D加速
	 * @type {string}
	 */
	this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';
	/**
	 * 判断是否支持css3的transition动画
	 * @type {*|boolean}
	 */
	this.options.useTransition = utils.hasTransition && this.options.useTransition;
	/**
	 * 判断是否支持css3的transform属性
	 * 目前主流的手机都支持transition及transform
	 * @type {*|boolean}
	 */
	this.options.useTransform = utils.hasTransform && this.options.useTransform;
	/**
	 * 是否支持事件穿透
	 * ？？？
	 */
	this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
	/**
	 * 是否阻止默认行为，这里一般设置为true防止页面在手机端被默认拖动
	 * @type {boolean}
	 */
	this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

	// If you want eventPassthrough I have to lock one of the axes
	/**
	 * 判断滚动的方向 X OR Y
	 * @type {boolean}
	 */
	this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
	this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

	// With eventPassthrough we also need lockDirection mechanism
	/**
	 * 是否支持双向同时自由滚动
	 * @type {boolean|*}
	 */
	this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
	this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;
	/**
	 * 惯性动画的设置
	 */
	this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;
	/**
	 * 当window触发resize事件60ms后还原
	 */
	this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

	if ( this.options.tap === true ) {
		this.options.tap = 'tap';
	}

// INSERT POINT: NORMALIZATION

	// Some defaults
	//一些默认，不会被重写的参数属性
	this.x = 0;
	this.y = 0;
	this.directionX = 0;
	this.directionY = 0;
	this._events = {};

// INSERT POINT: DEFAULTS
	/**
	 * 初始化
	 */
	this._init();
	this.refresh();

	this.scrollTo(this.options.startX, this.options.startY);
	this.enable();
}

IScroll.prototype = {
	version: '5.1.3',
	/**
	 * IScroll 的初始化方法
	 * @private
	 */
	_init: function () {
		this._initEvents();

// INSERT POINT: _init

	},
	/**
	 * IScroll 的销毁方法
	 */
	destroy: function () {
		this._initEvents(true);

		this._execEvent('destroy');
	},
	/**
	 *  'transitionend', 'webkitTransitionEnd','oTransitionEnd','MSTransitionEnd'触发该事件
	 * @param e
	 * @private
	 */
	_transitionEnd: function (e) {
		if ( e.target != this.scroller || !this.isInTransition ) {
			return;
		}

		this._transitionTime();
		if ( !this.resetPosition(this.options.bounceTime) ) {
			this.isInTransition = false;
			this._execEvent('scrollEnd');
		}
	},
	/**
	 *  'touchstart', 'pointerdown', 'MSPointerDown', 'mousedown'  触发该函数
	 * @param e
	 * @private
	 */
	_start: function (e) {
		// React to left mouse button only
		//判断是鼠标左键按下的拖动
		if ( utils.eventType[e.type] != 1 ) {
			if ( e.button !== 0 ) {
				return;
			}
		}
		//判断是否开启拖动，是否初始化完成
		if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
			return;
		}
		//如果options中设置了preventDefault 并且不是badandriod并且。。  则阻止默认事件
		if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.touches ? e.touches[0] : e,
			pos;

		this.initiated	= utils.eventType[e.type];
		this.moved		= false;
		this.distX		= 0;
		this.distY		= 0;
		this.directionX = 0;
		this.directionY = 0;
		this.directionLocked = 0;
		/**
		 * 开启动画时间，如果之前有动画的话，便要停止动画，因为没有传事件，所以动画便直接停止了
		 * 用于停止拖动产生的惯性动作（touchstart时也可能正在滚动）
		 */
		this._transitionTime();
		//记录touchstart 的时间
		this.startTime = utils.getTime();
		//如果正在动画状态，则让页面停止在手指触摸处   css3动画
		if ( this.options.useTransition && this.isInTransition ) {
			this.isInTransition = false;
			//获取X,Y坐标值
			pos = this.getComputedPosition();
			//touchstart时，让正在滚动的页面停下来
			this._translate(Math.round(pos.x), Math.round(pos.y));
			this._execEvent('scrollEnd');
		}
		//js动画   停止
		else if ( !this.options.useTransition && this.isAnimating ) {
			this.isAnimating = false;
			this._execEvent('scrollEnd');
		}
		//重新设置一些位置参数
		this.startX    = this.x;
		this.startY    = this.y;
		this.absStartX = this.x;
		this.absStartY = this.y;
		this.pointX    = point.pageX;
		this.pointY    = point.pageY;
		//触发beforeScrollStart事件   TODO 所以可以监听该事件进行一些before event
		this._execEvent('beforeScrollStart');
	},
	/**
	 * 'touchmove','pointermove','MSPointerMove','mousemove'时调用的函数
	 * @param e
	 * @private
	 */
	_move: function (e) {
		//判断是否可以滑动，初始化是否完成，否则。。
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}
		//看参数是否有设置禁用 默认行为
		if ( this.options.preventDefault ) {	// increases performance on Android? TODO: check!
			e.preventDefault();
		}
		/**
		 * 记录当前的一些数据，为dom移动做准备
		 */
		var point		= e.touches ? e.touches[0] : e,
			deltaX		= point.pageX - this.pointX,	//拖动的距离X 这里的值每300ms刷新一次的距离
			deltaY		= point.pageY - this.pointY,	//拖动的距离Y
			timestamp	= utils.getTime(),	//拖动时候的时间戳
			newX, newY,						//拖动目的地的 X   Y距离
			absDistX, absDistY;				//距离的绝对值，用于判断滚动方向

		this.pointX		= point.pageX;
		this.pointY		= point.pageY;

		this.distX		+= deltaX;
		this.distY		+= deltaY;
		absDistX		= Math.abs(this.distX);
		absDistY		= Math.abs(this.distY);

		// We need to move at least 10 pixels for the scrolling to initiate
		//滑动的时间大于300ms  并且距离小于10px   则不滑动
		if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
			return;
		}

		// If you are scrolling in one direction lock the other
		//根据10px的距离来确定用户意图，判断用户拖动的意图
		if ( !this.directionLocked && !this.options.freeScroll ) {
			if ( absDistX > absDistY + this.options.directionLockThreshold ) {
				this.directionLocked = 'h';		// lock horizontally
			} else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
				this.directionLocked = 'v';		// lock vertically
			} else {
				this.directionLocked = 'n';		// no lock
			}
		}
		//横向滚动
		if ( this.directionLocked == 'h' ) {
			if ( this.options.eventPassthrough == 'vertical' ) {
				e.preventDefault();
			}
			//todo
			else if ( this.options.eventPassthrough == 'horizontal' ) {
				this.initiated = false;
				return;
			}

			deltaY = 0;
		} else if ( this.directionLocked == 'v' ) {
			if ( this.options.eventPassthrough == 'horizontal' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'vertical' ) {
				this.initiated = false;
				return;
			}

			deltaX = 0;
		}
		//拖动的距离
		deltaX = this.hasHorizontalScroll ? deltaX : 0;
		deltaY = this.hasVerticalScroll ? deltaY : 0;
		//将当前位置 + 位移  =  实际移动的距离
		newX = this.x + deltaX;
		newY = this.y + deltaY;

		// Slow down if outside of the boundaries
		/**
		 * 如果拖动已经超出边界了，则减慢拖动的速度
		 */
		if ( newX > 0 || newX < this.maxScrollX ) {
			newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
		}
		if ( newY > 0 || newY < this.maxScrollY ) {
			newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
		}
		/**
		 * 确定滑动的方向
		 * @type {number}
		 */
		this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;
		//第一次拖动时的回调
		if ( !this.moved ) {
			this._execEvent('scrollStart');
		}

		this.moved = true;

		this._translate(newX, newY);

/* REPLACE START: _move */
		/**
		 * 每300ms会重置一次当前位置以及开始事件，这个就是为什么抓住不放很久突然丢开仍然有长距离移动的原因
		 */
		if ( timestamp - this.startTime > 300 ) {
			this.startTime = timestamp;
			this.startX = this.x;
			this.startY = this.y;
		}

/* REPLACE END: _move */

	},
	/**
	 *  'touchend':
	  'pointerup':
	  'MSPointerUp':
	  'mouseup':
	  'touchcancel':
	  'pointercancel':
	  'MSPointerCancel':
	  'mousecancel':
	 	执行该方法
	 * @param e
	 * @private
	 */
	_end: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}

		if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}
		//手指离开时  保存一些相关数据
		var point = e.changedTouches ? e.changedTouches[0] : e,
			momentumX,
			momentumY,
			duration = utils.getTime() - this.startTime,  //拖动的耗时，这里并不是touchstart质检的耗时，是在_move()里每隔300ms更新一次的时间
			newX = Math.round(this.x),
			newY = Math.round(this.y),
			distanceX = Math.abs(newX - this.startX), //拖动的距离
			distanceY = Math.abs(newY - this.startY),
			time = 0,
			easing = '';
		//重置一些参数
		this.isInTransition = 0;      //是否处于css动画的状态
		this.initiated = 0;			//是否初始化
		this.endTime = utils.getTime();

		// reset if we are outside of the boundaries
		//若超出边界，则将按照超出边界的逻辑走， 不执行end后续动作
		if ( this.resetPosition(this.options.bounceTime) ) {
			return;
		}
		//滚性拖动距离
		this.scrollTo(newX, newY);	// ensures that the last position is rounded

		// we scrolled less than 10 pixels

		//如果滚动小于10px则认为发生了tap 和 click事件
		if ( !this.moved ) {
			if ( this.options.tap ) {
				utils.tap(e, this.options.tap);
			}

			if ( this.options.click ) {
				utils.click(e);
			}
			//执行scrollCancel
			this._execEvent('scrollCancel');
			return;
		}
		//鼠标点击的 轻弹 事件
		if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 ) {
			this._execEvent('flick');
			return;
		}

		// start momentum animation if needed
		/**
		 *若果需要滚性移动的话   则运行如下计算公式
		 * 根据动力加速度计算出来的动画参数
		 * 计算出相关的距离
		 */
		if ( this.options.momentum && duration < 300 ) {
			momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
			momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
			newX = momentumX.destination;
			newY = momentumY.destination;
			time = Math.max(momentumX.duration, momentumY.duration);
			this.isInTransition = 1;
		}

// INSERT POINT: _end

		if ( newX != this.x || newY != this.y ) {
			// change easing function when scroller goes out of the boundaries
			//如果有惯性移动，并且惯性移动超出了边界，则开启css3动画的回弹效果
			if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
				easing = utils.ease.quadratic;
			}

			this.scrollTo(newX, newY, time, easing);
			return;
		}
		//调用scrollEnd事件
		this._execEvent('scrollEnd');
	},
	/**
	 * 方向、大小改变
	 * orientationchange resize事件调用该函数
	 * @private
	 */
	_resize: function () {
		var that = this;

		clearTimeout(this.resizeTimeout);

		this.resizeTimeout = setTimeout(function () {
			that.refresh();
		}, this.options.resizePolling);
	},
	/**
	 * _end    _transitionEnd     refresh
	 * 重置位置信息
	 * @param time
	 * @returns {boolean}
	 */
	resetPosition: function (time) {
		var x = this.x,
			y = this.y;

		time = time || 0;

		if ( !this.hasHorizontalScroll || this.x > 0 ) {
			x = 0;
		} else if ( this.x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( !this.hasVerticalScroll || this.y > 0 ) {
			y = 0;
		} else if ( this.y < this.maxScrollY ) {
			y = this.maxScrollY;
		}

		if ( x == this.x && y == this.y ) {
			return false;
		}
		//
		this.scrollTo(x, y, time, this.options.bounceEasing);

		return true;
	},
	/**
	 * 暴露给开发者用的方法
	 * 禁用Iscroll
	 */
	disable: function () {
		this.enabled = false;
	},
	/**
	 * 开启iscroll
	 */
	enable: function () {
		this.enabled = true;
	},
	/**
	 * 更新iscroll的相关信息，一般用于初始化时获取页面相关数据以便后续调用，
	 * 在异步加载、旋转屏幕时也调用该函数  重新获取页面数据
	 */
	refresh: function () {
		var rf = this.wrapper.offsetHeight;		// Force reflow

		this.wrapperWidth	= this.wrapper.clientWidth;
		this.wrapperHeight	= this.wrapper.clientHeight;

/* REPLACE START: refresh */

		this.scrollerWidth	= this.scroller.offsetWidth;
		this.scrollerHeight	= this.scroller.offsetHeight;

		this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
		this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;

/* REPLACE END: refresh */

		this.hasHorizontalScroll	= this.options.scrollX && this.maxScrollX < 0;
		this.hasVerticalScroll		= this.options.scrollY && this.maxScrollY < 0;
		//如果不能横向滚动 则重置maxScrollx为0 scrollerwidth和iscroll对象宽度一致
		if ( !this.hasHorizontalScroll ) {
			this.maxScrollX = 0;
			this.scrollerWidth = this.wrapperWidth;
		}

		if ( !this.hasVerticalScroll ) {
			this.maxScrollY = 0;
			this.scrollerHeight = this.wrapperHeight;
		}

		this.endTime = 0;
		this.directionX = 0;
		this.directionY = 0;
		//left top距离
		this.wrapperOffset = utils.offset(this.wrapper);
		//执行事件refresh
		this._execEvent('refresh');
		//重置位置
		this.resetPosition();

// INSERT POINT: _refresh

	},
	//iscroll对象绑定事件
	on: function (type, fn) {
		if ( !this._events[type] ) {
			this._events[type] = [];
		}

		this._events[type].push(fn);
	},
	//iscroll对象解绑事件方法
	off: function (type, fn) {
		if ( !this._events[type] ) {
			return;
		}

		var index = this._events[type].indexOf(fn);

		if ( index > -1 ) {
			this._events[type].splice(index, 1);
		}
	},
	/**
	 * 事件触发器，类似于zepto的triiger
	 * @param type
	 * @private
	 */
	_execEvent: function (type) {
		if ( !this._events[type] ) {
			return;
		}

		var i = 0,
			l = this._events[type].length;

		if ( !l ) {
			return;
		}

		for ( ; i < l; i++ ) {
			//？？？
			this._events[type][i].apply(this, [].slice.call(arguments, 1));
		}
	},
	/**
	 *
	 * @param x   滑动多少
	 * @param y
	 * @param time	滑动时间
	 * @param easing	动画
	 */
	scrollBy: function (x, y, time, easing) {
		x = this.x + x;
		y = this.y + y;
		time = time || 0;

		this.scrollTo(x, y, time, easing);
	},
	/**
	 *
	 * @param x	移动的x轴坐标
	 * @param y	移动的y轴坐标
	 * @param time
	 * @param easing
	 */
	scrollTo: function (x, y, time, easing) {
		easing = easing || utils.ease.circular;

		this.isInTransition = this.options.useTransition && time > 0;
		//如果有css动画或移动时间不存在，直接调用css3移动
		if ( !time || (this.options.useTransition && easing.style) ) {
			//设置相关的css3动画属性及位置，直接位移过去
			this._transitionTimingFunction(easing.style);
			this._transitionTime(time);
			this._translate(x, y);
		} else {
			//否则用js动画执行
			this._animate(x, y, time, easing.fn);
		}
	},
	/**
	 * 该方法实际上对scrollTo进一步封装，滚动到相应的元素区域
	 * @param el	为需要滚动的元素引用
	 * @param time	滚动时间
	 * @param offsetX{boolean}
	 * @param offsetY{boolean}
	 * @param easing	动画效果
	 */
	scrollToElement: function (el, time, offsetX, offsetY, easing) {
		el = el.nodeType ? el : this.scroller.querySelector(el);

		if ( !el ) {
			return;
		}
		//元素的位置情况
		var pos = utils.offset(el);

		pos.left -= this.wrapperOffset.left;
		pos.top  -= this.wrapperOffset.top;

		// if offsetX/Y are true we center the element to the screen
		// 如果offsetX   Y为true  则将该元素放在中间
		if ( offsetX === true ) {
			offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
		}
		if ( offsetY === true ) {
			offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
		}

		pos.left -= offsetX || 0;
		pos.top  -= offsetY || 0;

		pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
		pos.top  = pos.top  > 0 ? 0 : pos.top  < this.maxScrollY ? this.maxScrollY : pos.top;

		time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x-pos.left), Math.abs(this.y-pos.top)) : time;

		this.scrollTo(pos.left, pos.top, time, easing);
	},
	/**
	 *	css3动画时长
	 * @param time 动画时间，单位ms  如果不传参数则为0   即为直接停止动画
	 * @private
	 */
	_transitionTime: function (time) {
		time = time || 0;

		this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

		if ( !time && utils.isBadAndroid ) {
			this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
		}

// INSERT POINT: _transitionTime

	},
	/**
	 * css3 动画函数
	 * @param easing
	 * @private
	 */
	_transitionTimingFunction: function (easing) {
		this.scrollerStyle[utils.style.transitionTimingFunction] = easing;

// INSERT POINT: _transitionTimingFunction

	},
	/**
	 * 动画位移  如果支持css3动画，则使用transform进行位移
	 * iscroll都是靠它进行位移
	 * @param x
	 * @param y
	 * @private
	 */
	_translate: function (x, y) {
		if ( this.options.useTransform ) {

/* REPLACE START: _translate */

			this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

/* REPLACE END: _translate */

		} else {
			x = Math.round(x);
			y = Math.round(y);
			this.scrollerStyle.left = x + 'px';
			this.scrollerStyle.top = y + 'px';
		}

		this.x = x;
		this.y = y;

// INSERT POINT: _translate

	},
	/**
	 *页面初始化时的一些事件，如果传参数则是取消事件绑定，不传就是添加事件绑定
	 * @param remove    true   removeEvent   false addEvent
	 * @private
	 */
	_initEvents: function (remove) {
		var eventType = remove ? utils.removeEvent : utils.addEvent,
			//bindToWrapper 相对应的window事件绑定
			target = this.options.bindToWrapper ? this.wrapper : window;
		//旋转屏幕事件
		eventType(window, 'orientationchange', this);
		eventType(window, 'resize', this);

		if ( this.options.click ) {
			eventType(this.wrapper, 'click', this, true);
		}
		/**
		 * 判断机型做相应的事件绑定
		 * 针对PC的touch事件
		 */
		if ( !this.options.disableMouse ) {
			eventType(this.wrapper, 'mousedown', this);
			eventType(target, 'mousemove', this);
			eventType(target, 'mousecancel', this);
			eventType(target, 'mouseup', this);
		}
		/**
		 * 针对win phone的touch事件
		 */
		if ( utils.hasPointer && !this.options.disablePointer ) {
			eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
			eventType(target, utils.prefixPointerEvent('pointermove'), this);
			eventType(target, utils.prefixPointerEvent('pointercancel'), this);
			eventType(target, utils.prefixPointerEvent('pointerup'), this);
		}
		/**
		 * 针对ios & android的touch事件
		 */
		if ( utils.hasTouch && !this.options.disableTouch ) {
			eventType(this.wrapper, 'touchstart', this);
			eventType(target, 'touchmove', this);
			eventType(target, 'touchcancel', this);
			eventType(target, 'touchend', this);
		}
		/**
		 * css3 动画结束后的回调事件
		 */
		eventType(this.scroller, 'transitionend', this);
		eventType(this.scroller, 'webkitTransitionEnd', this);
		eventType(this.scroller, 'oTransitionEnd', this);
		eventType(this.scroller, 'MSTransitionEnd', this);
	},
	/**
	 * 获得一个DOM的实时样式，在touchstart石化保留DOM样式状态十分有用
	 * @returns {{x: *, y: *}}    返回x,y坐标的位移
	 */
	getComputedPosition: function () {
		var matrix = window.getComputedStyle(this.scroller, null),
			x, y;

		if ( this.options.useTransform ) {
			matrix = matrix[utils.style.transform].split(')')[0].split(', ');
			x = +(matrix[12] || matrix[4]);
			y = +(matrix[13] || matrix[5]);
		} else {
			x = +matrix.left.replace(/[^-\d.]/g, '');
			y = +matrix.top.replace(/[^-\d.]/g, '');
		}

		return { x: x, y: y };
	},
	/**
	 *如果启用了css3动画，便会使用css3动画方式进行动画，否则使用_animate方法（js实现方案）
	 *这里使用RAF的动画   用于保证动画的流畅性
	 * @param destX
	 * @param destY
	 * @param duration
	 * @param easingFn
	 * @private
	 */
	_animate: function (destX, destY, duration, easingFn) {
		var that = this,
			startX = this.x,
			startY = this.y,
			startTime = utils.getTime(),
			destTime = startTime + duration;

		function step () {
			var now = utils.getTime(),
				newX, newY,
				easing;
			//如果时间大于等于动画结束时间
			if ( now >= destTime ) {
				that.isAnimating = false;
				that._translate(destX, destY);

				if ( !that.resetPosition(that.options.bounceTime) ) {
					that._execEvent('scrollEnd');
				}

				return;
			}

			now = ( now - startTime ) / duration;
			easing = easingFn(now);
			newX = ( destX - startX ) * easing + startX;
			newY = ( destY - startY ) * easing + startY;
			that._translate(newX, newY);
			//递归调用来执行动画
			if ( that.isAnimating ) {
				rAF(step);
			}
		}

		this.isAnimating = true;
		step();
	},
	/**
	 * 根据事件执行相应的方法
	 * @param e
	 */
	handleEvent: function (e) {
		switch ( e.type ) {
			case 'touchstart':
			case 'pointerdown':
			case 'MSPointerDown':
			case 'mousedown':
				this._start(e);
				break;
			case 'touchmove':
			case 'pointermove':
			case 'MSPointerMove':
			case 'mousemove':
				this._move(e);
				break;
			case 'touchend':
			case 'pointerup':
			case 'MSPointerUp':
			case 'mouseup':
			case 'touchcancel':
			case 'pointercancel':
			case 'MSPointerCancel':
			case 'mousecancel':
				this._end(e);
				break;
			case 'orientationchange':
			case 'resize':
				this._resize();
				break;
			case 'transitionend':
			case 'webkitTransitionEnd':
			case 'oTransitionEnd':
			case 'MSTransitionEnd':
				this._transitionEnd(e);
				break;
			case 'wheel':
			case 'DOMMouseScroll':
			case 'mousewheel':
				this._wheel(e);
				break;
			case 'keydown':
				this._key(e);
				break;
			case 'click':
				if ( !e._constructed ) {
					e.preventDefault();
					e.stopPropagation();
				}
				break;
		}
	}
};
	/**
	 * 将utils工具类函数归到isroll下面   方便开发者调用
	 */
IScroll.utils = utils;

if ( typeof module != 'undefined' && module.exports ) {
	module.exports = IScroll;
} else {
	window.IScroll = IScroll;
}

})(window, document, Math);