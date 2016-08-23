'use strict';

import API from './api/api';
import OAuth from './api/hello';

export default (function App(window, document, $){
	console.log('run');

	const $button = $('#share');
	const $result = $('#result');

	let profile = {};

	function invite(){

		$button.on('click', function(e){
			e.preventDefault();
			console.log('go');


			if (!profile.id){

				OAuth.login()
				.then( ()=> {
					return API.getUser();
				})
				.then( user => {
					profile = user;
					if (canIDoIt()){
						getAll();
					}
				})
				.then( 
					() => {
						
					},
					err => {
						console.log(err);
					}
				);

				return;
			}

			getAll();
		});
	}

	function canIDoIt(){
		if (profile.roles.indexOf('EduParent') === -1){
			console.log('Только для родителей');
			$button.hide();
			return false;
		}
		return true;
	}


	function getAll(){

		if (!canIDoIt()){
			return false;
		}

		$button.attr('disabled', 'disabled');

		let data = {};

		API.getUserChildrenIds()
		.then( childrenIds => {
			console.log(childrenIds);
			data.childrenIds = childrenIds;

			const promises = [];

			childrenIds.map( id => {
				promises.push(API.getUser(id));
			});
			
			return Promise.all(promises);
		})
		.then( allChildrens => {
			console.log(allChildrens);

			const childrens = [].concat.apply([], allChildrens);
			const UniqChildrens = Array.from(new Set(childrens));

			data.UniqChildrens = UniqChildrens;
			data.ChildSchool = [];

			const promises = [];

			UniqChildrens.map( (children, i) => {
				data.ChildSchool.push(children.personId_str);
				promises.push(API.getUserSchools(children.id_str));
			});
			
			return Promise.all(promises);
		})
		.then( allSchools => {
			console.log('sdsdd');
			console.log(allSchools);
			console.log(data.ChildSchool);

			const childrenSchools = [];

			allSchools.map( (schools, i) => {
				schools.map( schoolId => {
					childrenSchools.push({childId: data.ChildSchool[i], schoolId: schoolId});
				})				
			});

			console.log(childrenSchools);

			const schools = [].concat.apply([], allSchools);

			const promises = [];

			console.log(data.UniqChildrens);

			childrenSchools.map( (childrenSchool, i) => {
				promises.push(API.getPersonEduGroupsBySchool(childrenSchool.childId, childrenSchool.schoolId));
			});
			
			return Promise.all(promises);
		})
		.then( AllEduGroups => {
			console.log(AllEduGroups);

			const eduGroups = [].concat.apply([], AllEduGroups);
			const UniqEduGroups = Array.from(new Set(eduGroups));



			const promises = [];

			UniqEduGroups.map( eguGroup => {
				promises.push(API.getEduGroupPersons(eguGroup.id_str));
			});
			
			return Promise.all(promises);

		})
		.then( allEguGroupsChildrens => {
			console.log(allEguGroupsChildrens);
			
			let allChildren = [];
			let allChildrenIds = [];
			let UniqAllChildrenIds = [];

			allEguGroupsChildrens.map( childrens => {
				allChildren = [...allChildren, ...childrens];
			});

			allChildren.map( children => {
				allChildrenIds.push(children.userId_str);
			}); 

			console.log('allChildrenIds', allChildrenIds);

			UniqAllChildrenIds = Array.from(new Set(allChildrenIds)).filter( childrenId => {
			 	return childrenId && data.childrenIds.indexOf(childrenId) === -1;
			});
			
			console.log('UniqAllChildrenIds', UniqAllChildrenIds);

			return UniqAllChildrenIds;
		})
		.then( UniqAllChildrenIds => {
			console.log(UniqAllChildrenIds);

			let promises = [];

			UniqAllChildrenIds.map( userId => {
				promises.push(API.getUserRelatives(userId));
			});
			
			return Promise.all(promises);
		})
		.then( allPersonsParents => {
			console.log(allPersonsParents);

			let allParents = [];
			let allParentsIds = [];
			let UniqAllParentsIds = [];

			allPersonsParents.map( parents => {
				allParents = [...allParents, ...parents];
			}); 

			console.log(allParents);

			allParents.map( parent => {
				allParentsIds.push(parent.person.userId_str);
			}); 

			console.log(allParentsIds);

			UniqAllParentsIds = Array.from(new Set(allParentsIds)).filter( parentId => {
			 	return parentId;
			});

			console.log(UniqAllParentsIds);

		})
		.then( () => {
			$result.html('Сообщения были отправлены');
			$button.hide();
		})
		.catch( err => { 
			$button.attr('disabled', false);
			$result.html('Произошла ошибка, попробуйте еще раз');
			console.error(err);
		});

	}

	function getUser(){
		$button.attr('disabled', 'disabled');

		API.getUser()
		.then( user => {
			console.log(user);
			$button.attr('disabled', false);
			profile = user;
			canIDoIt();
		})
		.catch( err => {
			$button.attr('disabled', false);
			console.error(err);
		});	
	}

	function init(){
		getUser();
		invite();
	}

	init();

})(window, document, jQuery, undefined);
