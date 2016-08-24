'use strict';

import API from './api/api';
import OAuth from './api/hello';

export default (function App(window, document, $){

	const $button = $('.js-share');
	const $result = $('.js-share-result');

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
		$result.html(message);
	}


	function isItAParent(){
		if (profile.roles.indexOf('EduParent') === -1){
			buttonHide('Рассылка сообщений только для родителей');
			return false;
		}
		return true;
	}

	function flatArrays(arrays){
		return [].concat.apply([], arrays);
	}

	function filterUniqArrayValues(array){
		return Array.from(new Set( array ));
	}

	function getUniqValuesFromArrays(arrays){
		return filterUniqArrayValues( flatArrays(arrays) ); // only unic
	}

	function getChunkPromises(items, chunkLength = 10, getPromisesFunc){
		return new Promise( (resolve, reject) => {

			let count = 0;
			const results = [];

			for (let i = 0; i < items.length ; i+=chunkLength){
				count++;

				const itemsChunk = items.slice(i,i+chunkLength);
				console.log(itemsChunk);

				setTimeout(() => {

					const promises = getPromisesFunc(itemsChunk); 

					console.log(promises);

					console.log('send chunk');

					Promise.all(promises)
					.then( values => {
						results.push(values);

						if (results.length === count){
							resolve( flatArrays(results) );
						}
					})
					.catch( err => {
						reject( err );
					});

				}, count*150);
			}

		});
	}


	function getAll(){

		let data = {};

		if (!isItAParent()){
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

			data.SchoolChildPersonIds = [];

			const promises = [];

			UniqChildrens.map( (children, i) => {
				data.SchoolChildPersonIds.push(children.personId_str);
				promises.push(API.getUserSchools(children.id_str));
			});
			
			return Promise.all(promises);
		})
		.then( allSchools => {
			console.log(allSchools);

			const childrenSchools = [];

			allSchools.map( (schools, i) => {
				schools.map( schoolId => {
					childrenSchools.push({childPersonId: data.SchoolChildPersonIds[i], schoolId: schoolId});
				})				
			});

			console.log(childrenSchools);

			const promises = childrenSchools.map( (childrenSchool, i) => {
				return API.getPersonEduGroupsBySchool(childrenSchool.childPersonId, childrenSchool.schoolId);
			});
			
			return Promise.all(promises);
		})
		.then( AllEduGroups => {
			console.log(AllEduGroups);

			const UniqEduGroups = getUniqValuesFromArrays(AllEduGroups);

			const promises = UniqEduGroups.map( eguGroup => {
				return API.getEduGroupPersons(eguGroup.id_str);
			});
			
			return Promise.all(promises);

		})
		.then( allEguGroupsChildrens => {
			console.log(allEguGroupsChildrens);
			
			const UniqAllChildren = getUniqValuesFromArrays(allEguGroupsChildrens);
			
			return getChunkPromises(UniqAllChildren, 10, (array) => {
				return array.map( user => {
					return API.getUserRelatives(user.userId_str);
				});
			});
		})
		.then( allPersonsParents => {
			console.log(allPersonsParents);

			const UniqAllParents = getUniqValuesFromArrays(allPersonsParents);

			//get ids and filter own profile and profile with no ID out
			//and send only ot mothers and fathers
			const UniqAllParentsIds = UniqAllParents.filter( parent => {
			 	if ( !parent.person.userId_str || (parent.person.userId_str === profile.id_str) ){
			 		return false;
			 	}
			 	if (parent.type !== 'Mother' && parent.type !== 'Father'){
			 		return false;
			 	}
			 	return true;
			}).map( parent => {
				return parent.person.userId_str
			});

			console.log(UniqAllParentsIds);

			const promises = [];
			const chunkLength = 10;
			const invitesDatas = [];

			for (let i = 0; i < UniqAllParentsIds.length ; i+=chunkLength){

				const UniqAllParentsIdsChunk = UniqAllParentsIds.slice(i,i+chunkLength);

				const invitesData = {
					userIds: UniqAllParentsIdsChunk,
					message: 'test',
				}

				invitesDatas.push(invitesData);
			}

			console.log('invitesDatas', invitesDatas);
			
			return getChunkPromises(invitesDatas, 10, (invitesDatas) => {
				return invitesDatas.map( invitesData => {
					return API.sendInvites(invitesData);
				});
			});
		})
		.then( (res) => {
			console.log(res);
			buttonHide('Сообщения были отправлены, спасибо!');
		})
		.catch( err => { 
			$result.html('Произошла ошибка, попробуйте еще раз.');
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
			isItAParent();
		})
		.catch( err => {
			console.error(err);
		})
		.then( () => {
			asyncEnd();
		});	
	}

	function actions(){

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

	function init(){
		getUser();
		actions();
	}

	return {
		init
	}

})(window, document, jQuery, undefined);
