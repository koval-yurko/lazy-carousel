import angular from 'angular';
import utils from 'my-utils';
import LazyCarousel_ from './LazyCarousel.js';
import swipeDecorator from './SwipeDecorator.js';
import keyHandlerDecorator from './KeyHandlerDecorator.js';

var myLazyCarouselModule = angular.module('myLazyCarousel', []);

// Controller
var MyLazyCarouselCtrl = (function() {
    var $timeout;

    var LazyCarousel = keyHandlerDecorator()(swipeDecorator()(LazyCarousel_));

    function MyLazyCarouselCtrl($scope, _$timeout_) {
        $timeout = _$timeout_;
        this.$scope = $scope;
        this._itemScopeAs = 'item';

        LazyCarousel.call(this, null, {
            noInit: true,
            changesTrackerOpts: {
                trackById: '_id',
                trackByIdFn: function(key, value, index, trackById) {
                    return value[trackById];
                }
            }
        });
    }
    MyLazyCarouselCtrl.$inject = ['$scope', '$timeout'];
    utils.inherits(MyLazyCarouselCtrl, LazyCarousel);

    MyLazyCarouselCtrl.prototype.init = function(elem, _transclude){
        this._transclude = _transclude;

        LazyCarousel.prototype.init.call(this, elem);
    };

    MyLazyCarouselCtrl.prototype._transclude = function($scope, callback){
        callback = callback || function(){};
        callback(false);
    };
    MyLazyCarouselCtrl.prototype._addItemPost = function(item, $item) {
        // compile

        var itemAs = this.$scope.itemAs || this._itemScopeAs;

        var childScope = this.$scope.$parent.$new();

        var self = this;
        this._transclude(childScope, function(elem, $scope){
            $scope[itemAs] = item;

            $scope.$carousel = self.$scope;
            $scope.$isActive = false;

            $scope.$watch('$carousel.active._id', function (newActiveId) {
                /*eslint-disable */
                $scope.$isActive = (newActiveId == item._id) ? true : false;
                /*eslint-enable */
            });

            angular.element($item).append(elem);

            $timeout(function(){
                $scope.$digest();
            });
        });
    };
    MyLazyCarouselCtrl.prototype._removeItemPre = function(item, $item, callback) {
        // destroy
        var $scope = angular.element($item).children().scope();
        $scope.$destroy();

        callback();
    };
    MyLazyCarouselCtrl.prototype._getItemTemplate = function(item) {
        return '<li class="lc-item" data-id="'+ item._id +'"></li>';
    };

    return MyLazyCarouselCtrl;
})();

// Directive
function MyLazyCarouselDirective($timeout) {
    var iid = 1;

    return {
        restrict: 'EA',
        transclude: true,
        scope: {
            items: '=myLazyCarousel',
            itemAs: '@itemAs',
            activeIndex: '=myLazyCarouselActive'
        },
        template:   '<div class="lc-list_holder">' +
                    '   <ul class="lc-list"></ul>' +
                    '</div>' +
                    '<div class="nav_holder" ng-class="{has_prev: nav.prev, has_next: nav.next}">' +
                    '   <a href="#/prev" ng-click="goTo($event, -1)" class="nav_link prev">' +
                    '       <span class="fonticon fonticon-arrow-left"></span>' +
                    '   </a>' +
                    '   <a href="#/next" ng-click="goTo($event, 1)" class="nav_link next" >' +
                    '       <span class="fonticon fonticon-arrow-right"></span>' +
                    '   </a>' +
                    '</div>',
        controller: 'myLazyCarouselCtrl',
        compile: function(tElement, tAttrs) {

            return function ($scope, element, attrs, ctrl, transclude) {
                $scope._iid = iid++;

                ctrl.init(element[0], transclude);

                if (attrs.noKeyDecorator && attrs.noKeyDecorator === 'true') {
                    ctrl.disableKeyHandlerDecorator();
                }

                $scope.active = null;
                $scope.nav = {
                    prev: false,
                    next: false
                };

                $scope.goTo = function ($event, dir) {
                    if ($event) {
                        $event.preventDefault();
                    }
                    ctrl.slideTo(parseInt(dir, 10));
                };

                $scope.setActive = function($event, item) {
                    if ($event) {
                        $event.preventDefault();
                    }
                    ctrl.slideToId(item._id);
                };

                $scope.$watch('items', function (newList) {
                    ctrl.updateItems(newList || [], $scope.activeIndex);
                });

                //$scope.$watch('activeIndex', function (newActiveIndex) {
                //    innerActiveIndex = $scope.activeIndex;
                //});

                $scope.$on('$destroy', ctrl.destroy.bind(ctrl));

                ctrl.$events.on('activeChange', function (data) {
                    var item = data.item;
                    /*eslint-disable */
                    if ($scope.active && item && $scope.active._id == item._id) {
                        return;
                    }
                    /*eslint-enable */

                    $scope.activeIndex = data.activeIndex;

                    $timeout(function () {
                        $scope.active = item;
                    });
                });

                ctrl.$events.on('navChange', function (nav) {
                    $timeout(function () {
                        $scope.nav.prev = nav.prev;
                        $scope.nav.next = nav.next;
                    });
                });
            };

        }
    };
}
MyLazyCarouselDirective.$inject = ['$timeout'];


myLazyCarouselModule.directive('myLazyCarousel', MyLazyCarouselDirective);
myLazyCarouselModule.controller('myLazyCarouselCtrl', MyLazyCarouselCtrl);

// Export
export default myLazyCarouselModule;
