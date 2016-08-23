'use strict';

export default (function App(window, document, $){

	const $opener = $('.js-conditions-opener');
	const $text = $('.js-conditions-text');

	function start(){
		$text.hide();
	}

	function actions(){
		$opener.on('click', function(e){
			e.preventDefault();

			$text.slideToggle();
		})
	}

	function init(){
		start();
		actions();
	}

	return {
		init
	}

})(window, document, jQuery, undefined);
