import { OAuthOptions, APIoptions } from 'appSettings';

hello.init({
	dnevnik: {
		name: 'Dnevnik',

		oauth: {
			version: 2,
			auth: OAuthOptions.authUrl,
			grant: OAuthOptions.grantUrl,
		},

		// Refresh the access_token once expired
		refresh: true,

		scope: {
			'basic': OAuthOptions.scope,
		},

		scope_delim: ' ',

		login: function(p) {
			p.options.popup.width = 710;
		},

		base: APIoptions.base,
	}
});

hello.init({
	dnevnik : OAuthOptions.clientId,
},{
	redirect_uri : OAuthOptions.redirectUrl,
});

const dnevnik = hello('dnevnik');

function getToken(){
	const response = dnevnik && dnevnik.getAuthResponse();
	return response ? response.access_token : false;
}

export default {
	login: () => dnevnik.login(),
	logout: () => dnevnik.logout(),
	getToken: getToken,
};
