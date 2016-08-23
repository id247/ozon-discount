//because hello.api() is piece of shit

import OAuth from './hello.js';

import { APIoptions } from 'appSettings';

function sendRequest(options){

	const accessToken = OAuth.getToken();

	if (!accessToken){
		return Promise.reject(requestError('Unauthorized', 'no token'));	
	}

	const url = generateUrl(APIoptions.base, options.path, accessToken);
		
	options.headers = {
		'Accept': '*/*',
		'Content-Type': 'application/json'
	};

	return fetch(url, options)
	.then( selectResponse );
} 

function generateUrl(base, path, token){
	const join = path.indexOf('?') > -1 ? '&' : '?';
	const url = base + path + join + 'access_token=' + token;
	return url;
}

function selectResponse(response){
	console.log(response);
	switch(response.status){
		case 204: 
			return 'ok';
			break;
		case 200: 
			return response.json();
		// case 400: 
		// 	throw selectRequestError(response.json());
		// 	break;
		case 401: 
			throw requestError('Unauthorized', '');
			break;
		default:
			throw requestError(response.status, response.statusText);
	}	
}

function selectRequestError(res){

	console.log(res.type);

	switch(res.type){
		case 'tokenRequired':
		case 'invalidToken':
			return requestError('Unauthorized', res.type + ': ' + res.description);
			break;
		case 'apiResourceUnavailable':
		case 'parameterInvalid':
		case 'invalidRequest':
			return requestError('ResourceUnavailable', res.type + ': ' + res.description);
			break;
		default:
			return requestError('Unknown', res.type + ': ' + res.description);
	}

}

function requestError(name, description){
	const err = new Error();
	err.message = name;
	err.description = description;
	return err;
}

export default sendRequest;
