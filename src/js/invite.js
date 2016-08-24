'use strict';

import API from './api/api';
import OAuth from './api/hello';

export default (function App(window, document, $){

	const $button = $('.js-share');
	const $result = $('.js-share-result');
	const $loader = $('.js-share-loader');

	let profile = {};

	function asyncStart(){
		console.log('go');
		$button.attr('disabled', 'disabled');
		$loader.show();
	}

	function asyncEnd(){
		console.log('end');
		$button.attr('disabled', false);
		$loader.hide();
	}

	function buttonHide(message){
		console.log(message);
		$button.hide();
		$result.html(message);
	}


	function isItAParent(){
		if (profile.roles.indexOf('EduParent') === -1){
			buttonHide('Рассылка сообщений доступна только для родителей');
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



	//chunk arrays and send in to getPromisesFunc function wich returns a Promise or array of Promises
	function getChunkPromises(items, chunkLength = 10, getPromisesFunc){

		function isIterable(obj) {
			// checks for null and undefined
			if (obj == null) {
			return false;
			}
			return typeof obj[Symbol.iterator] === 'function';
		}

		function getChunks(items, chunkLength = 10){

			const chunks = [];

			for (let i = 0; i < items.length ; i+=chunkLength){
				chunks.push(items.slice(i,i+chunkLength));
			}

			return chunks;
		}

		return new Promise( (resolve, reject) => {

			let count = 0;
			const results = [];
			const itemsChunks = getChunks(items, chunkLength);

			itemsChunks.map( itemsChunk => {
				count++;

				setTimeout(() => {

					let promises = getPromisesFunc(itemsChunk); 

					console.log('send chunk');

					//in single Promise - push in to array for Promise.all
					if (!isIterable(promises)){
						promises = [promises];
					}

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


				}, count*500);
			});
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

			UniqChildrens
			.filter(children => (children.personId_str && children.id_str))
			.map( (children, i) => {
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

			const promises = childrenSchools.map( childrenSchool => {
				return API.getPersonEduGroupsBySchool(childrenSchool.childPersonId, childrenSchool.schoolId);
			});
			
			return Promise.all(promises);
		})
		.then( AllEduGroups => {
			console.log(AllEduGroups);

			const UniqEduGroups = getUniqValuesFromArrays(AllEduGroups);

			const promises = UniqEduGroups
			.filter(eguGroup => eguGroup.id_str)
			.map( eguGroup => {
				return API.getEduGroupPersons(eguGroup.id_str);
			});
			
			return Promise.all(promises);

		})
		.then( allEguGroupsChildrens => {
			console.log(allEguGroupsChildrens);
			
			const UniqAllChildren = getUniqValuesFromArrays(allEguGroupsChildrens);
			
			return getChunkPromises(UniqAllChildren, 10, (UniqAllChildrenChunk) => {
				return UniqAllChildrenChunk
				.filter(user => user.userId_str)
				.map( user => {
					return API.getUserRelatives(user.userId_str);
				});
			});
		})
		.then( allPersonsParents => {
			console.log(allPersonsParents);

			//get ids and filter own profile and profile with no ID out
			//and send only ot mothers and fathers
			const AllParentsIds = flatArrays(allPersonsParents)
			.filter( parent => {
			 	if ( !parent.person.userId_str || (parent.person.userId_str === profile.id_str) ){
			 		return false;
			 	}
			 	if (parent.type !== 'Mother' && parent.type !== 'Father'){
			 		return false;
			 	}
			 	return true;
			})
			.map( parent => {
				return (parent.person.userId_str)
			});

			const UniqAllParentsIds = getUniqValuesFromArrays(AllParentsIds);

			console.log(UniqAllParentsIds);

			return getChunkPromises(UniqAllParentsIds, 10, (UniqAllParentsIdsChunk) => {
				const invitesData = {
					userIds: UniqAllParentsIdsChunk,
					message: 'test',
				}
				return API.sendInvites(invitesData);
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
