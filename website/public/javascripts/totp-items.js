angular.module('mpmApp', [])
	.controller('ListController', function($scope, $http, $interval) {
		var ctrl = this;
		this.items = [];
		this.loader = true;
		this.error = false;
		this.nextTick = 30000;
		this.itemToDelete = {};
		var modalDelete = UIkit.modal("#modalDeleteItem");

		this.refreshNow = function() {
			loadItems();
		}

		this.deleteModal = function(item) {
			ctrl.itemToDelete = item;
			modalDelete.show();
		}

		this.deleteItem = function() {
			$http({
				method: "DELETE",
				url: "/ajax/totp/item",
				params: {
					id: ctrl.itemToDelete._id,
				}
			}).then(
				function successCallback(response) {
					if (response.data.error) {
						UIkit.notify(response.data.message, "danger");
					} else {
						UIkit.notify("Item deleted", "success");
						loadItems();
					}
				},
				function errorCallback(response) {
					UIkit.notify("An error occured, please try again", "danger");
				}
			);
			modalDelete.hide();
		}

		function loadItems() {
			ctrl.items = [];
			ctrl.loader = true;
			ctrl.error = false;
			$http({
				method: "GET",
				url: "/ajax/totp/items",
				params: {
					category: ctrl.category
				}
			}).then(
				function successCallback(response) {
					if (response.data.error) {
						UIkit.notify(response.data.message, "danger");
					} else {
						ctrl.items = angular.copy(response.data.data.items);
						ctrl.loader = false;
						this.nextTick = angular.copy(response.data.data.nextTick);
						if (ctrl.items.length != 0) {
							$interval.cancel(this.timer);
							this.timer = $interval(function() {
								loadItems();
							}, this.nextTick);
							$("#timer").attr("data-time", this.nextTick);
							$("#timer").circletimer({
								timeout: this.nextTick,
								onUpdate: function(elapsed) {
									$("#timeLeft").text(Math.floor(($("#timer").attr("data-time") - Math.round(elapsed)) / 1000));
								},
							});
							$("#timer").circletimer("start");
						}
					}
				},
				function errorCallback(response) {
					ctrl.loader = false;
					ctrl.error = true;
				}
			);
		}
		loadItems();
	});