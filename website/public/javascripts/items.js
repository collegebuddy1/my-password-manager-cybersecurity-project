angular.module('mpmApp', [])
	.controller('ListController', function($scope, $http) {
		var ctrl = this;
		this.categories = [{
			_id: "all",
			title: "All"
		}];
		this.items = [];
		this.loader = true;
		this.error = false;
		this.bAddCategory = false;
		this.category = "all";
		this.categoryToRename = {};
		this.categoryToDelete = {};
		this.new_category = "";
		this.rename_category = "";
		var modalRename = UIkit.modal("#modalRenameCategory");
		var modalDelete = UIkit.modal("#modalDeleteCategory");

		function loadItems() {
			ctrl.items = [];
			ctrl.loader = true;
			$http({
				method: "GET",
				url: "/ajax/items",
				params: {
					category: ctrl.category
				}
			}).then(
				function successCallback(response) {
					if (response.data.error) {
						UIkit.notify(response.data.message, "danger");
					} else {
						ctrl.items = angular.copy(response.data.data);
						for (var i = 0; i < ctrl.items.length; i++) {
							if (typeof ctrl.items[i].category_id == "undefined") {
								ctrl.items[i].category_id = "all";
							}
						};
						ctrl.loader = false;
					}
				},
				function errorCallback(response) {
					ctrl.loader = false;
					ctrl.error = true;
				}
			);
		}

		function loadCategories() {
			$http({
				method: "GET",
				url: "/ajax/categories",
			}).then(
				function successCallback(response) {
					if (response.data.error) {
						UIkit.notify(response.data.message, "danger");
					} else {
						ctrl.categories = angular.copy(response.data.data);
						ctrl.categories.unshift({
							_id: "all",
							title: "All"
						});
					}
				},
				function errorCallback(response) {
					UIkit.notify("An error occured, please try again", "danger");
				}
			);
		}

		loadCategories();
		loadItems();

		this.changeCategory = function(cat_id) {
			ctrl.category = cat_id;
			loadItems();
		}

		this.displayAddCategory = function() {
			ctrl.bAddCategory = true;
		}

		this.addCategory = function() {
			if (ctrl.new_category == "") {
				return false;
			}
			$http({
				method: "POST",
				url: "/ajax/category",
				data: {
					category: ctrl.new_category
				}
			}).then(
				function successCallback(response) {
					if (response.data.error) {
						UIkit.notify(response.data.message, "danger");
					} else {
						ctrl.categories.push(angular.copy(response.data.data));
						ctrl.new_category = "";
						ctrl.bAddCategory = false;
					}
				},
				function errorCallback(response) {
					UIkit.notify("An error occured, please try again", "danger");
				}
			);
		}

		this.cancelAddCategory = function() {
			ctrl.bAddCategory = false;
			ctrl.new_category = "";
		}

		this.renameCategoryModal = function(cat) {
			ctrl.rename_category = cat.title;
			ctrl.categoryToRename = cat;
			modalRename.show();
		}

		this.renameCategory = function() {
			$http({
				method: "PUT",
				url: "/ajax/category",
				data: {
					id: ctrl.categoryToRename._id,
					title: ctrl.rename_category
				}
			}).then(
				function successCallback(response) {
					if (response.data.error) {
						UIkit.notify(response.data.message, "danger");
					} else {
						UIkit.notify("Category renammed", "success");
						ctrl.categoryToRename = {};
						var categories = [];
						for (var i = 0; i < ctrl.categories.length; i++) {
							if (ctrl.categories[i]._id != response.data.data._id) {
								categories.push(ctrl.categories[i]);
							} else {
								categories.push(response.data.data);
							}
						};
						ctrl.categories = categories;
					}
				},
				function errorCallback(response) {
					UIkit.notify("An error occured, please try again", "danger");
					ctrl.categoryToRename = {};
				}
			);
			modalRename.hide();
		}

		this.deleteCategoryModal = function(cat) {
			ctrl.categoryToDelete = cat;
			modalDelete.show();
		}

		this.deleteCategory = function() {
			$http({
				method: "DELETE",
				url: "/ajax/category",
				params: {
					id: ctrl.categoryToDelete._id,
				}
			}).then(
				function successCallback(response) {
					if (response.data.error) {
						UIkit.notify(response.data.message, "danger");
					} else {
						UIkit.notify("Category deleted", "success");
						var categories = [];
						for (var i = 0; i < ctrl.categories.length; i++) {
							if (ctrl.categories[i]._id != ctrl.categoryToDelete._id) {
								categories.push(ctrl.categories[i]);
							}
						};
						ctrl.categories = categories;
						ctrl.category = "all";
						loadItems();
					}
				},
				function errorCallback(response) {
					UIkit.notify("An error occured, please try again", "danger");
				}
			);
			modalDelete.hide();
		}

	})
	.directive('mpmProgress', function() {
		return {
			restrict: 'E',
			scope: {
				item: '=item',
			},
			template: '<div class="uk-margin-top uk-progress uk-progress-mini {{ item.pwd_strength_color }}" ng-show="item.infos_displayed" data-uk-tooltip title="{{ item.pwd_strength_title }}"><div class="uk-progress-bar" style="width: {{ item.pwd_strength_size }};"></div></div>'
		};
	})
	.directive('mpmIteminfo', function() {
		return {
			restrict: 'E',
			scope: {
				item: '=',
				items: '=',
			},
			transclude: true,
			controller: function($scope, $http) {
				$scope.togglePassword = function(item) {
					if (item.pwd_displayed) {
						item.password_hidden = item.old_pwd_hidden;
						item.pwd_displayed = false;
					} else {
						$http({
							method: "GET",
							url: "/ajax/password",
							params: {
								item_id: item._id
							}
						}).then(
							function successCallback(response) {
								if (response.data.error) {
									UIkit.notify(response.data.message, "danger");
								} else {
									item.pwd_displayed = true;
									item.password = angular.copy(response.data.data);
									item.old_pwd_hidden = item.password_hidden;
									item.password_hidden = item.password;
								}
							},
							function errorCallback(response) {
								UIkit.notify("An error occured, please try again", "danger");
							}
						);
					}
				}

				$scope.toggleInfos = function(item) {
					if (item.infos_displayed) {
						item.infos_displayed = false;
					} else {
						$http({
							method: "GET",
							url: "/ajax/item",
							params: {
								item_id: item._id
							}
						}).then(
							function successCallback(response) {
								if (response.data.error) {
									UIkit.notify(response.data.message, "danger");
								} else {
									item.infos_displayed = true;
									var tmp_item = angular.copy(response.data.data);

									item.pwd_strength_size = tmp_item.password_strength / 5;
									item.comment = tmp_item.comment;
									item.pwd_strength_color = get_pwd_strength_color(item.pwd_strength_size);
									item.pwd_strength_title = get_pwd_strength_title(item.pwd_strength_size);
									item.pwd_strength_size = item.pwd_strength_size + "%";
								}
							},
							function errorCallback(response) {
								UIkit.notify("An error occured, please try again", "danger");
							}
						);
					}
				}

				$scope.toggleEdit = function(item) {
					$http({
						method: "GET",
						url: "/ajax/password",
						params: {
							item_id: item._id
						}
					}).then(
						function successCallback(response) {
							if (response.data.error) {
								UIkit.notify(response.data.message, "danger");
							} else {
								item.toEdit = !item.toEdit;
								item.title_toedit = item.title;
								item.comment_toedit = item.comment;
								item.url_toedit = item.url;
								item.username_toedit = item.username;
								item.category_toedit = item.category_id;
								item.password = angular.copy(response.data.data);
							}
						},
						function errorCallback(response) {
							UIkit.notify("An error occured, please try again", "danger");
						}
					);
				}
				$scope.deleteItem = function(item) {
					$http({
						method: "DELETE",
						url: "/ajax/item",
						params: {
							item_id: item._id
						}
					}).then(
						function successCallback(response) {
							if (response.data.error) {
								UIkit.notify(response.data.message, "danger");
							} else {
								var items = [];
								for (var i = 0; i < $scope.items.length; i++) {
									if ($scope.items[i]._id != item._id) {
										items.push($scope.items[i]);
									}
								};
								$scope.items = items;
								UIkit.notify("Item successfully deleted", "success");
							}
						},
						function errorCallback(response) {
							UIkit.notify("An error occured, please try again", "danger");
						}
					);
				}
			},
			templateUrl: '/item-infos.html'
		};
	})
	.directive('mpmItemedit', function() {
		return {
			restrict: 'E',
			scope: {
				item: '=item',
				items: '=',
				category: '=category',
				categories: '=categories',
			},
			transclude: true,
			controller: function($scope, $http) {
				$scope.edit = function(item) {
					$http({
						method: "POST",
						url: "/ajax/item",
						data: {
							item_id: item._id,
							item_title: item.title_toedit,
							item_comment: item.comment_toedit,
							item_url: item.url_toedit,
							item_username: item.username_toedit,
							item_category: item.category_toedit,
							item_password: item.password
						}
					}).then(
						function successCallback(response) {
							if (response.data.error) {
								UIkit.notify(response.data.message, "danger");
							} else {
								var old_cat = item.category_id;
								var item_tmp = angular.copy(response.data.data);
								item.title = item_tmp.title;
								item.comment = item_tmp.comment;
								item.url = item_tmp.url;
								item.username = item_tmp.username;
								item.category_id = item_tmp.category_id;
								item.password_hidden = item_tmp.password_hidden;
								item.pwd_displayed = false;


								item.pwd_strength_size = item_tmp.password_strength / 5;
								item.pwd_strength_color = get_pwd_strength_color(item.pwd_strength_size);
								item.pwd_strength_title = get_pwd_strength_title(item.pwd_strength_size);
								item.pwd_strength_size = item.pwd_strength_size + "%";

								item.toEdit = !item.toEdit;

								if ($scope.category != "all") {
									var items = [];
									for (var i = 0; i < $scope.items.length; i++) {
										if ($scope.items[i]._id == item._id) {
											if (old_cat == item.category_id)
												items.push($scope.items[i]);
										} else {
											items.push($scope.items[i]);
										}
									};
									$scope.items = items;
								}
								UIkit.notify("Item saved", "success");
							}
						},
						function errorCallback(response) {
							UIkit.notify("An error occured, please try again", "danger");
						}
					);

				}
				$scope.toggleEdit = function(item) {
					item.toEdit = !item.toEdit;
				}
			},
			templateUrl: '/item-edit.html'
		};
	});

function get_pwd_strength_color(strength) {
	if (strength >= 65)
		return "uk-progress-success";
	else if (strength >= 35)
		return "uk-progress-warning";
	else
		return "uk-progress-danger";
}

function get_pwd_strength_title(strength) {
	if (strength >= 85)
		return "Very strong";
	else if (strength >= 70)
		return "Strong";
	else if (strength >= 50)
		return "Good";
	else if (strength >= 30)
		return "Weak";
	else
		return "Very weak";
}
$(function() {
	var clipboard = new Clipboard(".btnCopy", {
		text: function(trigger) {
			var tmp = "null";
			$.ajax({
				method: "GET",
				url: "/ajax/password",
				dataType: "json",
				data: {
					item_id: trigger.getAttribute('data-item-id')
				},
				async: false
			}).done(
				function(response) {
					if (response.error) {
						UIkit.notify(response.message, "danger");
					} else {
						tmp = response.data;
					}
				}
			).fail(
				function(response) {
					console.log("fail");
					UIkit.notify("An error occured, please try again", "danger");
				}
			);
			return tmp;
		}
	});
});