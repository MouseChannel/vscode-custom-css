exports.messages = {
	admin: "Run VS Code with admin privileges so the changes can be applied.",
	enabled:
		"Restart to apply Custom CSS and JS. ",
	disabled: "Custom CSS and JS disabled and reverted to default. Restart to take effect.",
	already_disabled: "Custom CSS and JS already disabled.",
	somethingWrong: "Something went wrong: ",
	restartIde: "Restart Visual Studio Code",
	notfound: "Custom CSS and JS not found.",
	notConfigured:
		"Custom CSS and JS path not configured. " +
		'Please set "vscode_custom_css.imports" in your user settings.',
	reloadAfterVersionUpgrade:
		"Detected reloading CSS / JS after VSCode is upgraded. " + "Performing application only.",
	unableToLocateVsCodeInstallationPath:
		"Unable to locate the installation path of VSCode. This extension may not function correctly.",
	cannotLoad: url => `Cannot load '${url}'. Skipping.`
};
