'use strict';

import API from './api/api';
import OAuth from './api/hello';

export default (function App(window, document, $){
	console.log('run');

	const $button = $('#share');
	const $result = $('#result');

	let profile = {};

	function asyncStart(){
		console.log('go');
		$button.attr('disabled', 'disabled');
	}

	function asyncEnd(){
		console.log('end');
		$button.attr('disabled', false);
	}

	function buttonHide(message){
		console.log(message);
		$button.hide();
	}

	function invite(){

		$button.on('click', function(e){
			e.preventDefault();
			asyncStart();

			if (!profile.id){

				OAuth.login()
				.then( ()=> {
					return API.getUser();
				})
				.then( user => {
					profile = user;
					return getAll();
				})
				.then( 
					() => {
						
					},
					err => {
						console.log(err);
					}
				).then( () => {
					asyncEnd();
				});

				return;
			}

			getAll();
		});
	}

	function canIDoIt(){
		if (profile.roles.indexOf('EduParent') === -1){
			buttonHide('Только для родителей');
			return false;
		}
		return true;
	}

	function getUniqValuesFromArrays(arrays){
		const joinArrays = [].concat.apply([], arrays); //join in one array
		return Array.from(new Set(joinArrays)); // only unic
	}


	function getAll(){

		let data = {};

		if (!canIDoIt()){
			return false;
		}

		asyncStart();

		return API.getUserChildrenIds()
		.then( childrenIds => {
			console.log(childrenIds);
			
			return API.getUsers(childrenIds);
		})
		.then( allChildrens => {
			console.log(allChildrens);

			const UniqChildrens = getUniqValuesFromArrays(allChildrens);

			data.ChildSchool = [];

			const promises = [];

			UniqChildrens.map( (children, i) => {
				data.ChildSchool.push(children.personId_str);
				promises.push(API.getUserSchools(children.id_str));
			});
			
			return Promise.all(promises);
		})
		.then( allSchools => {
			console.log(allSchools);

			const childrenSchools = [];

			allSchools.map( (schools, i) => {
				schools.map( schoolId => {
					childrenSchools.push({childId: data.ChildSchool[i], schoolId: schoolId});
				})				
			});

			console.log(childrenSchools);

			const promises = [];

			childrenSchools.map( (childrenSchool, i) => {
				promises.push(API.getPersonEduGroupsBySchool(childrenSchool.childId, childrenSchool.schoolId));
			});
			
			return Promise.all(promises);
		})
		.then( AllEduGroups => {
			console.log(AllEduGroups);

			const UniqEduGroups = getUniqValuesFromArrays(AllEduGroups);

			const promises = [];

			UniqEduGroups.map( eguGroup => {
				promises.push(API.getEduGroupPersons(eguGroup.id_str));
			});
			
			return Promise.all(promises);

		})
		.then( allEguGroupsChildrens => {
			console.log(allEguGroupsChildrens);
			
			const UniqAllChildren = getUniqValuesFromArrays(allEguGroupsChildrens);
			
			let promises = [];

			UniqAllChildren.map( user => {
				promises.push(API.getUserRelatives(user.userId_str));
			});
			
			return Promise.all(promises);
		})
		.then( allPersonsParents => {
			console.log(allPersonsParents);

			const UniqAllParents = getUniqValuesFromArrays(allPersonsParents);

			//get ids and filter own profile out
			const UniqAllParentsIds = UniqAllParents.map( parent => {
				return parent.person.userId_str
			}).filter( parentId => {
			 	return parentId !== profile.id_str;
			});

			console.log(UniqAllParentsIds);

			const invitesData = {
				userIds: UniqAllParentsIds,
				message: 'test',
			}

			return API.sendInvites(invitesData);
		})
		.then( (res) => {
			console.log(res);
			buttonHide('Сообщения были отправлены');
			$result.html('Сообщения были отправлены');
		})
		.catch( err => { 
			$result.html('Произошла ошибка, попробуйте еще раз');
			console.error(err);
		})
		.then( () => {
			asyncEnd();
		});	
	}

	function getUser(){
		asyncStart();

		API.getUser()
		.then( user => {
			console.log(user);
			profile = user;
			canIDoIt();
		})
		.catch( err => {
			console.error(err);
		})
		.then( () => {
			asyncEnd();
		});	
	}

	function init(){
		getUser();
		invite();
	}

	init();

})(window, document, jQuery, undefined);
