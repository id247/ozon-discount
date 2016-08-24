'use strict';

import Ajax from './ajax.js';

function paramsError(description){
	return Promise.reject(new Error(description));
}

export default {
	getUser: (userId = 'me') => {
		if (!userId){
			return paramsError('no userId in API.getUser');
		}
		const options = {
			path: 'users/' + userId,
		};

		return Ajax(options);
	},
	getUsers: (data) => {
		if (!data){
			return paramsError('no data in API.getUsers');
		}

		const options = {
			path: 'users/many',
			method: 'post',
			body: JSON.stringify(data),
		};

		return Ajax(options);
	},
	getUserFriendsIds: (userId = 'me') => {
		if (!userId){
			return paramsError('no userId in API.getUserFriendsIds');
		}
		const options = {
			path: 'users/' + userId + '/friends',
		};

		return Ajax(options);
	},
	getUserRelatives: (userId = 'me') => {
		if (!userId){
			return paramsError('no userId in API.getUserRelatives');
		}
		const options = {
			path: 'users/' + userId + '/relatives',
		};

		return Ajax(options);
	},
	sendMessage: (data) => {
		if (!data){
			return paramsError('no data in API.sendMessage');
		}
		const options = {
			path: 'messages',
			method: 'post',
			body: JSON.stringify(data),
		};

		return Ajax(options);
	},
	sendInvites: (data) => {
		if (!data){
			return paramsError('no data in API.sendInvites');
		}
		const options = {
			path: 'invites',
			method: 'post',
			body: JSON.stringify(data),
		};

		return Ajax(options);
	},
	postToWall: (userId, data) => {
		if (!userId){
			return paramsError('no userId in API.postToWall');
		}
		if (!data){
			return paramsError('no data in API.postToWall');
		}

		const options = {
			path: 'users/' + userId + '/wall-items',
			method: 'put',
			body: JSON.stringify(data),
		};

		return Ajax(options);
	},
	getUserSchools: (userId = 'me') => {
		if (!userId){
			return paramsError('no userId in API.getUserSchools');
		}
		const options = {
			path: 'users/' + userId + '/schools',
		};

		return Ajax(options);
	},
	getUserChildrenIds: () => {
		const options = {
			path: 'users/me/children',
		};

		return Ajax(options);
	},
	getPersonEduGroupsBySchool: (personId, schoolId) => {
		if (!personId){
			return paramsError('no personId in API.getPersonEduGroupsBySchool');
		}
		if (!schoolId){
			return paramsError('no schoolId in API.getPersonEduGroupsBySchool');
		}
		const options = {
			path: 'persons/' + personId + '/schools/' + schoolId + '/edu-groups',
		};

		return Ajax(options);
	},
	getEduGroupPersons: (eduGroupId) => {
		if (!eduGroupId){
			return paramsError('no eduGroupId in API.getEduGroupPersons');
		}
		const options = {
			path: 'edu-groups/' + eduGroupId + '/persons',
		};

		return Ajax(options);
	},
} 



