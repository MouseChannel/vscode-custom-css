// import { exec } from 'child_process';
const { exec } = require('child_process');
const WinReg = require('winreg');
const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const https = require('https');
const path = require("path");
const msg = require("./messages").messages;
const uuid = require("uuid");
const fetch = require("node-fetch");
const Url = require("url");
const { spawn } = require('child_process');
function activate(context)
{
	const appDir = require.main
		? path.dirname(require.main.filename)
		: globalThis._VSCODE_FILE_ROOT;
	if (!appDir)
	{
		vscode.window.showInformationMessage(msg.unableToLocateVsCodeInstallationPath);
	}

	const base = path.join(appDir, "vs", "code");
	let htmlFile = path.join(base, "electron-sandbox", "workbench", "workbench.html");
	if (!fs.existsSync(htmlFile))
	{
		htmlFile = path.join(base, "electron-sandbox", "workbench", "workbench.esm.html");
	}
	if (!fs.existsSync(htmlFile))
	{
		vscode.window.showInformationMessage(msg.unableToLocateVsCodeInstallationPath);
	}
	const BackupFilePath = uuid =>
		path.join(base, "electron-sandbox", "workbench", `workbench.${uuid}.bak-custom-css`);

	function resolveVariable(key)
	{
		const variables = {
			cwd: () => process.cwd(),
			userHome: () => os.homedir(),
			execPath: () => process.env.VSCODE_EXEC_PATH ?? process.execPath,
			pathSeparator: () => path.sep,
			"/": () => path.sep,
		};

		if (key in variables) return variables[key]();

		if (key.startsWith('env:'))
		{
			const [_, envKey, optionalDefault] = key.split(':');
			return process.env[envKey] ?? optionalDefault ?? '';
		}
	}

	async function getContent(url)
	{
		if (/^file:/.test(url))
		{
			// regex matches any "${<RESOLVE>}" and replaces with resolveVariable(<RESOLVE>)
			// eg:  "HELLO ${userHome} WORLD" -> "HELLO /home/username WORLD"
			const resolved = url.replaceAll(/\$\{([^\{\}]+)\}/g, (substr, key) => resolveVariable(key) ?? substr);
			const fp = Url.fileURLToPath(resolved);

			return await fs.promises.readFile(fp);
		} else
		{
			const response = await fetch(url);
			return response.buffer();
		}
	}
	function downloadFont(url, localPath, progress, maxRedirects = 5, currentRedirects = 0)
	{
		return new Promise((resolve, reject) =>
		{
			if (currentRedirects >= maxRedirects)
			{
				return reject(new Error('download Failed'));
			}
			const parsedUrl = new URL(url);
			const options = {
				hostname: parsedUrl.hostname,
				path: parsedUrl.pathname + parsedUrl.search,
				method: 'GET'
			};
			const req = https.request(options, (res) =>
			{
				if (res.statusCode === 302)
				{
					const newUrl = new URL(res.headers.location, url);
					downloadFont(newUrl.href, localPath, progress, maxRedirects, currentRedirects + 1)
						.then(resolve)
						.catch(reject);
				} else if (res.statusCode === 200)
				{
					const totalLength = parseInt(res.headers['content-length'], 10);
					let downloadedLength = 0;
					let percentCompleted_last = 0;

					const writer = fs.createWriteStream(localPath);
					res.on('data', (chunk) =>
					{
						downloadedLength += chunk.length;
						let percentCompleted = Math.round((downloadedLength * 100) / totalLength);
						if (percentCompleted != percentCompleted_last)
							progress.report({ increment: percentCompleted - percentCompleted_last });
						percentCompleted_last = percentCompleted;
					});
					res.pipe(writer);
					writer.on('finish', () =>
					{
						resolve();
					});
					writer.on('error', (err) =>
					{
						reject(err);
					});
				} else
				{
					reject(new Error(`request Fail code: ${res.statusCode}`));
				}
			});
			req.on('error', (error) =>
			{
				reject(error);
			});
			req.end();
		});
	}
	async function installFont()
	{
		if (os.platform() == "darwin" || os.platform() == "linux")
		{
			const scriptPath = path.join(__dirname, "../my/installFont.sh");
			exec(`sh ${scriptPath}`, (error, stdout, stderr) =>
			{
				if (error)
				{
					console.error(`执行错误: ${error}`);
					return;
				}
				console.log(`输出: ${stdout}`);
				if (stderr) console.error(`错误输出: ${stderr}`);
			});
			return
			// const child = spawn('sh', scriptPath);
			// child.stdout.on('data', (data) =>
			// {
			// 	console.log(`输出: ${data}`);
			// });

			// child.stderr.on('data', (data) =>
			// {
			// 	console.error(`错误输出: ${data}`);
			// });

			// child.on('close', (code) =>
			// {
			// 	console.log(`子进程退出，退出码 ${code}`);
			// });


		}
		if (os.platform() == "linux")
		{
			const scriptPath = path.join(__dirname, "../my/installFont_linux.sh");
			exec(`sh ${scriptPath}`, (error, stdout, stderr) =>
			{
				if (error)
				{
					console.error(`执行错误: ${error}`);
					return;
				}
				console.log(`输出: ${stdout}`);
				if (stderr) console.error(`错误输出: ${stderr}`);
			});
			return
			// const child = spawn('sh', scriptPath);
			// child.stdout.on('data', (data) =>
			// {
			// 	console.log(`输出: ${data}`);
			// });

			// child.stderr.on('data', (data) =>
			// {
			// 	console.error(`错误输出: ${data}`);
			// });

			// child.on('close', (code) =>
			// {
			// 	console.log(`子进程退出，退出码 ${code}`);
			// });


		}
		let aa = os.platform()
		print(os.platform())

		const fileUrl = "https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip";
		const fileName = path.basename(fileUrl);


		const homeDir = os.homedir();
		const filePath = path.join(path.join(os.homedir(), "AppData\\Local\\Temp"), fileName);
		const dst_font_dir = "C:\\Windows\\Fonts\\JetBrainsMono"
		if (!fs.existsSync(filePath))
		{
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: 'Downloading Font...',
				cancellable: false
			}, async (progress) =>
			{
				try
				{
					await downloadFont(fileUrl, filePath, progress, 5);

				} catch (error)
				{
					vscode.window.showErrorMessage('Download Fail:' + error.message);
				}
			});
		} else
		{
			vscode.window.showInformationMessage('use System Font!');
		}
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Installing Font',
			cancellable: false
		}, (progress) =>
		{
			return new Promise((resolve, reject) =>
			{
				const scriptPath = path.join(__dirname, "../my/installFont.ps1");
				const powershell = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
				let last = 0
				powershell.stdout.on('data', (data) =>
				{
					const output = data.toString();
					const cur = Number(output.slice(0, -1).split(/[ \n]/).at(-2))
					const total = Number(output.slice(0, -1).split(/[ \n]/).at(-1))

					progress.report({ increment: (cur - last) * 100 / total });

					last = cur
				});
				powershell.on('close', (code) =>
				{
					if (code === 0)
					{
						resolve();
					} else
					{
						reject(new Error(`install fail: ${code}`));
					}
				});
				powershell.on('error', (err) =>
				{
					reject(err);
				});
			});
		});


	}

	// ####  main commands ######################################################

	async function cmdInstall()
	{
		await installFont();
		const uuidSession = uuid.v4();
		await createBackup(uuidSession);
		await performPatch(uuidSession);
	}

	async function cmdReinstall()
	{
		await uninstallImpl();
		await cmdInstall();
	}

	async function cmdUninstall()
	{
		await uninstallImpl();
		disabledRestart();
	}

	async function uninstallImpl()
	{
		const backupUuid = await getBackupUuid(htmlFile);
		if (!backupUuid) return;
		const backupPath = BackupFilePath(backupUuid);
		await restoreBackup(backupPath);
		await deleteBackupFiles();
	}

	// #### Backup ################################################################

	async function getBackupUuid(htmlFilePath)
	{
		try
		{
			const htmlContent = await fs.promises.readFile(htmlFilePath, "utf-8");
			const m = htmlContent.match(
				/<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ([0-9a-fA-F-]+) !! -->/
			);
			if (!m) return null;
			else return m[1];
		} catch (e)
		{
			vscode.window.showInformationMessage(msg.somethingWrong + e);
			throw e;
		}
	}

	async function createBackup(uuidSession)
	{
		try
		{
			let html = await fs.promises.readFile(htmlFile, "utf-8");
			html = clearExistingPatches(html);
			await fs.promises.writeFile(BackupFilePath(uuidSession), html, "utf-8");
		} catch (e)
		{
			vscode.window.showInformationMessage(msg.admin);
			throw e;
		}
	}

	async function restoreBackup(backupFilePath)
	{
		try
		{
			if (fs.existsSync(backupFilePath))
			{
				await fs.promises.unlink(htmlFile);
				await fs.promises.copyFile(backupFilePath, htmlFile);
			}
		} catch (e)
		{
			vscode.window.showInformationMessage(msg.admin);
			throw e;
		}
	}

	async function deleteBackupFiles()
	{
		const htmlDir = path.dirname(htmlFile);
		const htmlDirItems = await fs.promises.readdir(htmlDir);
		for (const item of htmlDirItems)
		{
			if (item.endsWith(".bak-custom-css"))
			{
				await fs.promises.unlink(path.join(htmlDir, item));
			}
		}
	}

	// #### Patching ##############################################################

	async function performPatch(uuidSession)
	{
		const config = vscode.workspace.getConfiguration("vscode_custom_css");
		if (!patchIsProperlyConfigured(config))
		{
			return vscode.window.showInformationMessage(msg.notConfigured);
		}

		let html = await fs.promises.readFile(htmlFile, "utf-8");
		html = clearExistingPatches(html);

		const injectHTML = await patchHtml(config);
		html = html.replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, "");

		let indicatorJS = "";
		if (config.statusbar) indicatorJS = await getIndicatorJs();

		html = html.replace(
			/(<\/html>)/,
			`<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ${uuidSession} !! -->\n` +
			"<!-- !! VSCODE-CUSTOM-CSS-START !! -->\n" +
			indicatorJS +
			injectHTML +
			"<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n</html>"
		);
		try
		{
			await fs.promises.writeFile(htmlFile, html, "utf-8");
		} catch (e)
		{
			vscode.window.showInformationMessage(msg.admin);
			disabledRestart();
		}
		enabledRestart();
	}
	function clearExistingPatches(html)
	{
		html = html.replace(
			/<!-- !! VSCODE-CUSTOM-CSS-START !! -->[\s\S]*?<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n*/,
			""
		);
		html = html.replace(/<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID [\w-]+ !! -->\n*/g, "");
		return html;
	}

	function patchIsProperlyConfigured(config)
	{
		return config && config.imports && config.imports instanceof Array;
	}

	async function patchHtml(config)
	{
		let res = "";



		// for (const item of config.imports) {
		// 	const imp = await patchHtmlForItem(item);
		// 	if (imp) res += imp;
		// }
		const mycustom = [
			path.join("file://", __dirname, "../my/my.js"),
			path.join("file://", __dirname, "../my/custom-vscode.css"),

		];
		for (const item of mycustom)
		{
			const imp = await patchHtmlForItem(item);
			if (imp) res += imp;
		}
		return res;
	}
	async function patchHtmlForItem(url)
	{
		if (!url) return "";
		if (typeof url !== "string") return "";

		// Copy the resource to a staging directory inside the extension dir
		let parsed = new Url.URL(url);
		const ext = path.extname(parsed.pathname);

		try
		{
			const fetched = await getContent(url);
			if (ext === ".css")
			{
				return `<style>${fetched}</style>`;
			} else if (ext === ".js")
			{
				return `<script>${fetched}</script>`;
			} else
			{
				console.log(`Unsupported extension type: ${ext}`);
			}
		} catch (e)
		{
			console.error(e);
			vscode.window.showWarningMessage(msg.cannotLoad(url));
			return "";
		}
	}
	async function getIndicatorJs()
	{
		let indicatorJsPath;
		let ext = vscode.extensions.getExtension("be5invis.vscode-custom-css");
		if (ext && ext.extensionPath)
		{
			indicatorJsPath = path.resolve(ext.extensionPath, "src/statusbar.js");
		} else
		{
			indicatorJsPath = path.resolve(__dirname, "statusbar.js");
		}
		const indicatorJsContent = await fs.promises.readFile(indicatorJsPath, "utf-8");
		return `<script>${indicatorJsContent}</script>`;
	}

	function reloadWindow()
	{
		// reload vscode-window
		vscode.commands.executeCommand("workbench.action.closeWindow");
	}
	function enabledRestart()
	{
		vscode.window
			.showInformationMessage(msg.enabled, { title: msg.restartIde })
			.then(reloadWindow);
	}
	function disabledRestart()
	{
		vscode.window
			.showInformationMessage(msg.disabled, { title: msg.restartIde })
			.then(reloadWindow);
	}

	const installCustomCSS = vscode.commands.registerCommand(
		"extension.installCustomCSS",
		cmdInstall
	);
	const uninstallCustomCSS = vscode.commands.registerCommand(
		"extension.uninstallCustomCSS",
		cmdUninstall
	);
	const updateCustomCSS = vscode.commands.registerCommand(
		"extension.updateCustomCSS",
		cmdReinstall
	);

	context.subscriptions.push(installCustomCSS);
	context.subscriptions.push(uninstallCustomCSS);
	context.subscriptions.push(updateCustomCSS);

	console.log("vscode-custom-css is active!");
	console.log("Application directory", appDir);
	console.log("Main HTML file", htmlFile);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
