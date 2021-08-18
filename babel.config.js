module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				// 取代 @babel/polyfill
				useBuiltIns: 'usage',
				corejs: 3,
				// debug: true,
			},
		],
	],
}
