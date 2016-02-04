var S = {
	showString:["letter|魑","image|3","letter|O(∩_∩)O~","image|1"],
	init:function(){
		S.Drawing.init(".canvas");
		var dot = new S.Dot(100,100);
		S.SceneController.performAction(this.showString);
		S.Drawing.loop(function(){
			S.Shape.render();
		});
	}
};
/**
 * 粒子位置模型
 * @param {Object} args {"x":,"y":,"z":,"a":,"h":}
 */
S.Point = function(args){  //x,y,z,alpha
	this.x = args.x;
	this.y = args.y;
	this.z = args.z;//半径
	this.a = args.a;//透明度
	this.r = args.r;
	this.g = args.g;
	this.b = args.b;
	this.h = args.h;//粒子在该点的停留时间
};
/**
 * 颜色模型
 */
S.Color = function (r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
};

S.Color.prototype.render = function () {
    return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
};

/**
 * 小范围随机晃动的粒子模型
 */
S.Dot = function(x,y,r,g,b){
	this.p = new S.Point({
		x:x,
		y:y,
		z:5,
		a:1,
		r:r || 255,
		g:g || 255,
		b:b || 255,
		h:0
	});
	
	this.c = new S.Color(this.p.r, this.p.g, this.p.b, this.p.a);		
	
	this.e = 0.09;//速度
  	this.s = true;//是否为组成图形中的粒子
  	this.t = this.clone();
  	this.q = [];
};
S.Dot.prototype = {
	clone:function(){
		return new S.Point({
	      	x: this.p.x,
	      	y: this.p.y,
	      	z: this.p.z,
	      	a: this.p.a,
	      	r: this.p.r,
	      	g: this.p.g,
	      	b: this.p.b,
	      	h: this.p.h
	    });
	},
	_isNumber:function(n){
		return !isNaN(parseFloat(n)) && isFinite(n);
	},
	/**
	 * 更新粒子运动位置，如果粒子未到达目标点，返回false;粒子已经到达目标点，返回true
	 * @param  {[type]} position 目标位置
	 */
	_moveTowards:function(n){
		var details = this._distanceTo(n,true),
			dx = details[0],
			dy = details[1],
			d = details[2],
			e = this.e*d;
		//更新颜色
		var self = this;
		["r","g","b"].forEach(function(key){
			self.c[key] = n[key];
		});
		//更新位置
		if(this.p.h === -1){
			this.p.x = n.x;
			this.p.y = n.y;
			return true;
		}
		if(d>1){
			this.p.x -= (dx/d)*e;
			this.p.y -= (dy/d)*e;
		}else{
			if(this.p.h>0){
				this.p.h--;
			}else{
				return true;
			}
		}
		return false;
	},
	_update:function(){ //更新粒子的位置
		var p = null;
		if(this._moveTowards(this.t)){ //粒子已经运动到上一个目标位置
			p = this.q.shift();//取出新的目标位置
			if(p){//更新粒子的目标位置，this.t
				this.t.x = p.x || this.p.x;
		        this.t.y = p.y || this.p.y;
		        this.t.z = p.z || this.p.z;
		        this.t.a = p.a || this.p.a;
		        this.t.r = this._isNumber(p.r) ? p.r : 255;
		        this.t.g = this._isNumber(p.g) ? p.g : 255;
		        this.t.b = this._isNumber(p.b) ? p.b : 255;
		        this.p.h = p.h || 0;
			}else{ //当p不存在时，粒子做随机运动
				if(this.s){ //粒子为组成图形中的一个，做小范围晃动
							//结合上面代码，将粒子拉回到目标位置
					        //if (this.p.h === -1) {  
							//   this.p.x = n.x;
							//   this.p.y = n.y;
							//   return true;
							// }
					this.p.x -= Math.sin(Math.random() * 3.142);
          			this.p.y -= Math.sin(Math.random() * 3.142);
				}else{//粒子在背景中，做大范围随机运动[-25,25]
					this.moveTo(new S.Point({
			            x: this.p.x + (Math.random() * 50) - 25,
			            y: this.p.y + (Math.random() * 50) - 25,
			         }));
				}
			}
		}
		//大小和颜色改变
	    d = this.p.a - this.t.a;
	    this.p.a = Math.max(0.1, this.p.a - (d * 0.05));
	    d = this.p.z - this.t.z;
	    this.p.z = Math.max(1, this.p.z - (d * 0.05));
	},
	/**
	 * 计算点的当前位置距离目标的距离
	 * @param  {[type]} n       目标位置
	 * @param  {[type]} details 是否返回详细信息  true:返回值为[dx,dy,d];false:返回值为d
	 */
	_distanceTo:function(n, details){
		var dx = this.p.x - n.x,
			dy = this.p.y - n.y,
			d = Math.sqrt(dx*dx+dy*dy);
		return details?[dx,dy,d]:d;
	},
	/**
	 * 将shape得出的目标位置存入粒子运动的目标序列中
	 */
	moveTo:function(p){
		this.q.push(p);
	},
	_draw:function(){
		this.c.a = this.p.a;
		S.Drawing.drawCircle(this.p,this.c);
	},
	render: function () {
	    this._update();
	    this._draw();
  	}
};
S.Drawing = (function(){
	var canvas,
		canvasCatch,
    	context,
    	contextCatch,
        renderFn,
	    requestFrame = window.requestAnimationFrame       ||
	                   window.webkitRequestAnimationFrame ||
	                   window.mozRequestAnimationFrame    ||
	                   window.oRequestAnimationFrame      ||
	                   window.msRequestAnimationFrame     ||
	                   function(callback) {
	                     window.setTimeout(callback, 1000 / 60);
	                   };
	return {
		init:function(ele){
			canvas = document.querySelector(ele);
			context = canvas.getContext('2d');
			canvasCatch = document.createElement('canvas');
			contextCatch = canvasCatch.getContext('2d');
			this.adjustCanvas();

			window.addEventListener('resize', function (e) {
				S.Drawing.adjustCanvas();
			});
		},
		getArea:function(){
			return { w: canvas.width, h: canvas.height };
		},
		adjustCanvas:function(){
			canvas.width = window.innerWidth;
      		canvas.height = window.innerHeight;
      		canvasCatch.width = canvas.width;
      		canvasCatch.height = canvas.height;
		},
		clearFrame: function(){
			context.clearRect(0, 0, canvas.width, canvas.height);
			contextCatch.clearRect(0, 0, canvasCatch.width, canvasCatch.height);
		},
		loop:function(fn){
			renderFn = !renderFn ? fn : renderFn;
			this.clearFrame();
			renderFn();
			context.drawImage(canvasCatch , 0, 0);
			requestFrame.call(window,this.loop.bind(this));
		},
		drawCircle: function (p, c) {
			contextCatch.fillStyle = c.render();
			contextCatch.beginPath();
			contextCatch.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
			contextCatch.closePath();
			contextCatch.fill();
		},
		drawLetter: function(l) {
			S.Shape.switchShape(S.ShapeBuilder.letter(l));
		},
		drawImage: function(index) {
			S.ShapeBuilder.imageFile(index,function(arg){
				S.Shape.switchShape(arg);
			});
		}
	};                  
}());
/**
 * canvas绘制图形命令处理
 */
S.Commond = (function(){
	var commondHash = {
		"letter":function(l){
			S.Drawing.drawLetter(l);
		},
		"image":function(index){
			S.Drawing.drawImage(index);
		}
	}
	return {
		exce: function(commondString){
			var c,args,tempSplit;
			if(typeof commondString !== "string" || commondString.indexOf('|') === -1){
				return;
			}
			tempSplit = commondString.split("|");
			c = tempSplit[0];
			args = tempSplit[1];
			typeof commondHash[c] !== "undefined" && commondHash[c](args);
		}
	}
}());
//粒子绘制图形
S.Shape = (function(){
	var dots = [],
		cx = 0,
		cy = 0,
		width = 0,
		height = 0;
	function fixToCenter(){
		var a = S.Drawing.getArea();
		cx = (a.w - width) / 2;
		cy = (a.h - height) /2;
	}
	return {
		switchShape:function(n){			
			var newdotsLen = n.dots.length,
				olddotsLen = dots.length,
				size,
				a = S.Drawing.getArea(),
				i = 0,
				d = 0;
			width = n.w;
			height = n.h;
			fixToCenter();
			//判断当前粒子数量是否够组成图形，若不够则生成新的粒子
			size = newdotsLen - olddotsLen;
			for(i =0; i<size; i++){
				dots.push(new S.Dot(a.w/2,a.h/2));
			}
			//设置粒子的目标位置，组成图形
			for(;d<newdotsLen;d++){
				i = Math.floor(Math.random()*n.dots.length); //随机选择其中的一个粒子
				if(dots[d].s){//该点是原图形的组成点之一,则先变大
					dots[d].moveTo(new S.Point({
						z:Math.random()*20+10,
						a:Math.random(),
						h:18
					}));
				}else{ //该点不是原图形的组成点之一
					dots[d].moveTo(new S.Point({
						z:Math.random()*5+5,
						a:Math.random(),
						h:18
					}));
				}
				dots[d].s = true;
				dots[d].moveTo(new S.Point({  //设置点的目标位置
					x: n.dots[i].x + cx,
					y: n.dots[i].y + cy,
					z: 5,
					a: 1,
					r: n.dots[i].r,
					g: n.dots[i].g,
					b: n.dots[i].b,
					h: 0
				}));
				n.dots = n.dots.slice(0,i).concat(n.dots.slice(i + 1));
			}
			for(;d<olddotsLen;d++){ //处理多余的粒子
				if(dots[d].s){
					dots[d].moveTo(new S.Point({
						z:Math.random()*20+10,
						a:Math.random(),
						h:18
					}));
				}
				dots[d].s = false;
				dots[d].e = 0.04;
				dots[d].moveTo(new S.Point({
					x:Math.random()*a.w,
					y:Math.random()*a.h,
					a:0.3,
					z:Math.random() * 4,
					h:0
				}));
			}
		},
		render:function(){
			dots.forEach(function(dot){
				dot.render();
			});
		}
	}
}());
S.ShapeBuilder = (function(){
	var gap = 13,
      	shapeCanvas = document.createElement('canvas'),
      	shapeContext = shapeCanvas.getContext('2d'),
      	fontSize = 500,
      	fontFamily = 'Avenir, Helvetica Neue, Helvetica, Arial, sans-serif';
    function fit() {
    	var g;
	    shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;
	    shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;
	    
	    g = shapeContext.createLinearGradient(0,0,shapeCanvas.width,shapeCanvas.height);
	    g.addColorStop(0,'rgb(255,255,0)');
		g.addColorStop(1,'rgb(0,255,255)');
	    
	    shapeContext.fillStyle = g;
	    shapeContext.textBaseline = 'middle';
	    shapeContext.textAlign = 'center';
    }
    function init() {
    	fit();
    	window.addEventListener('resize', fit);
    }
    function setFontsize(l){
    	var s = fontSize;
    	shapeContext.font = 'bold ' + s + 'px ' + fontFamily;
    	//调整字符的fontsize使字符可以完全放置在屏幕中。
    	//注：fontsize实际设置的是字符的高度，也就是说这里预设置的fontsize=500px，那么字符的高度为500px
    	s = Math.min( fontSize,
    				 (shapeCanvas.width / shapeContext.measureText(l).width) * 0.8 * fontSize,
    				  shapeCanvas.height*0.45);
    	shapeContext.font = 'bold ' + s + 'px ' + fontFamily;
    }
    function processCanvas(){
    	//将canvas转化为image
    	var pixels = shapeContext.getImageData(0,0,shapeCanvas.width,shapeCanvas.height).data,
    	    x = 0,
    	    y = 0,
    	    fx = shapeCanvas.width,
    	    fy = shapeCanvas.height,
    	    w = 0,
    	    h = 0,
    	    dots = [],
    	    colors = [];
    	for(var p=0,len = pixels.length; p<len; p+=(gap*4)){//对于 ImageData 对象中的每个像素，都存在着四方面的信息，即 RGBA 值
    		if(pixels[p+3]>0){//图案为红色（不透明），无图的地方为透明，a值为0
    			dots.push(new S.Point({
    				x:x,
    				y:y,
    				r:pixels[p],
    				g:pixels[p+1],
    				b:pixels[p+2]
    			}));
    			w = x > w ? x : w;//w,h为图案的最大宽，和最大高
    			h = y > h ? y : h;
    			fx = x < fx ? x : fx;//fx,fy为图案的最小宽，和最小高
    			fy = y < fy ? y : fy;
    		}
    		x += gap;
    		if(x>=shapeCanvas.width){
    			x = 0;
    			y += gap;
    			p += gap * 4 * shapeCanvas.width;
    		}
    	}
    	return {dots:dots, w:w+fx, h:h+fy}
    }
    init();
	return {
		changeColor:function(c){
			shapeContext.fillStyle = c;
		},
		/**
		 * 构建字符类图形
		 */
		letter:function(l){
			//1.图形绘制在canvas上
			setFontsize(l);
			shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
			shapeContext.fillText(l, shapeCanvas.width/2, shapeCanvas.height/2);
			//2.处理canvas转化为一堆点,返回粒子图形的信息（一堆带坐标的点）
			return processCanvas();
		},
		/**
		 * 构建图像
		 */
		imageFile: function (index,callback) {
			var image = new Image(),
			  a = S.Drawing.getArea();

			image.onload = function () {
				shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
				shapeContext.drawImage(this, 0, 0, a.w * 0.9, a.w * 0.9);
				callback(processCanvas());
			};

			image.onerror = function () {
				console.error("error");
				callback({});
			}

			image.src = './img/pic'+index+'.jpg';
		}
	}
}());
S.SceneController = (function(){
	var interval,
		delay = 4000,
		sceneQueue = [],
		state = 0;//0表示当前消费者停止从sceneQueue中获取下一个场景,1表示进行中；当sceneQueue.length=0时，会停止
	function timedAction(fn, t, isRepeat) {//从sceneQueue中去场景，每delay内执行一次	
		state = 1;
		fn(sceneQueue[0]);
		if(isRepeat){ 
			sceneQueue.push(sceneQueue.shift());
		}else{
			sceneQueue.shift();
		}
		if(sceneQueue.length === 0){
			clearTimeout(interval);
			state = 0;
			return;
		}
		interval = setTimeout(function(){
			timedAction(fn, t, isRepeat);
		},t);
    }
    function run(){
    	// timedAction(function(arg){
    	// 	S.Drawing.drawLetter(arg);
    	// },delay,false);
    	timedAction(function(arg){
    		S.Commond.exce(arg);
    	},delay,false);
    }
    return {
    	performAction:function(arg){
    		sceneQueue = sceneQueue.concat(arg);
    		if(!state){
    			run();
    		}
    	}
    }
}());
S.init();