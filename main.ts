import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { formatBulletList, formatNumberedList, formatAlphabeticalList, formatRomanList, formatCheckboxList } from './list-formatter';

// Remember to rename these classes and interfaces!

interface AdvancedListSettings {
	defaultStyle: string;
	enabledStyles: string[];
}

const DEFAULT_ADVANCED_LIST_SETTINGS: AdvancedListSettings = {
	defaultStyle: 'bullet',
	enabledStyles: ['bullet', 'numbered', 'alphabetical', 'alphabeticalUpper', 'roman', 'romanUpper', 'checkbox']
}

interface MyPluginSettings {
	mySetting: string;
	advancedListSettings: AdvancedListSettings;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	advancedListSettings: DEFAULT_ADVANCED_LIST_SETTINGS
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		this.addCommand({
			id: 'apply-list-style',
			name: 'Apply list style',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				new ListStyleModal(this.app, this.settings.advancedListSettings, (style) => {
					let formattedText = '';
					switch (style) {
						case 'bullet':
							formattedText = formatBulletList(selection);
							break;
						case 'numbered':
							formattedText = formatNumberedList(selection);
							break;
						case 'alphabetical':
							formattedText = formatAlphabeticalList(selection, true); // lower
							break;
						case 'alphabeticalUpper':
							formattedText = formatAlphabeticalList(selection, false); // UPPER
							break;
						case 'roman':
							formattedText = formatRomanList(selection, true); // lower
							break;
						case 'romanUpper':
							formattedText = formatRomanList(selection, false); // UPPER
							break;
						case 'checkbox':
							formattedText = formatCheckboxList(selection);
							break;
						default:
							console.error('Unknown list style:', style);
							new Notice('Unknown list style selected.');
							return; 
					}
					editor.replaceSelection(formattedText);
				}).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AdvancedListSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

const ALL_POSSIBLE_STYLES: Record<string, string> = {
	'bullet': 'Bullet List (- item)',
	'numbered': 'Numbered List (1. item)',
	'alphabetical': 'Alphabetical List (a. item)',
	'alphabeticalUpper': 'Alphabetical List (A. item)',
	'roman': 'Roman Numeral List (i. item)',
	'romanUpper': 'Roman Numeral List (I. item)',
	'checkbox': 'Checkbox List (- [ ] item)'
};

class ListStyleModal extends Modal {
	pluginSettings: AdvancedListSettings;
	callback: (style: string) => void;

	constructor(app: App, pluginSettings: AdvancedListSettings, callback: (style: string) => void) {
		super(app);
		this.pluginSettings = pluginSettings;
		this.callback = callback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Choose List Format' });

		this.pluginSettings.enabledStyles.forEach(styleId => {
			if (ALL_POSSIBLE_STYLES[styleId]) { // Ensure styleId is valid
				const button = contentEl.createEl('button', { 
					text: ALL_POSSIBLE_STYLES[styleId],
					cls: 'list-style-modal-button' 
				});
				button.addEventListener('click', () => {
					this.callback(styleId);
					this.close();
				});
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class AdvancedListSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Default list style')
			.setDesc('Choose your default list style.')
			.addDropdown(dropdown => {
				// Clear existing options to prevent duplication on refresh
				dropdown.selectEl.empty(); 
				
				// Add currently selected default style first to ensure it's always in the list
				const currentDefault = this.plugin.settings.advancedListSettings.defaultStyle;
				if (ALL_POSSIBLE_STYLES[currentDefault] && this.plugin.settings.advancedListSettings.enabledStyles.includes(currentDefault)) {
					dropdown.addOption(currentDefault, ALL_POSSIBLE_STYLES[currentDefault]);
				} else if (this.plugin.settings.advancedListSettings.enabledStyles.length > 0) {
					// If current default is somehow invalid or not enabled, pick the first enabled one
					const firstEnabled = this.plugin.settings.advancedListSettings.enabledStyles[0];
					this.plugin.settings.advancedListSettings.defaultStyle = firstEnabled; // Correct the setting
					dropdown.addOption(firstEnabled, ALL_POSSIBLE_STYLES[firstEnabled] || firstEnabled);
				} else {
					// Fallback if no styles are enabled (should not happen with default settings)
					dropdown.addOption('bullet', ALL_POSSIBLE_STYLES['bullet']);
          this.plugin.settings.advancedListSettings.defaultStyle = 'bullet';
				}
				
				this.plugin.settings.advancedListSettings.enabledStyles.forEach(styleId => {
					if (styleId !== this.plugin.settings.advancedListSettings.defaultStyle && ALL_POSSIBLE_STYLES[styleId]) {
						dropdown.addOption(styleId, ALL_POSSIBLE_STYLES[styleId]);
					}
				});
				dropdown.setValue(this.plugin.settings.advancedListSettings.defaultStyle);
				dropdown.onChange(async (value) => {
					this.plugin.settings.advancedListSettings.defaultStyle = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Enabled list styles')
			.setDesc('Choose which list styles are available in the formatting modal.');

		for (const styleId in ALL_POSSIBLE_STYLES) {
			const label = ALL_POSSIBLE_STYLES[styleId];
			new Setting(containerEl)
				.setName(label) // Use the descriptive label for the setting name
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.advancedListSettings.enabledStyles.includes(styleId))
					.onChange(async (value) => {
						const { enabledStyles } = this.plugin.settings.advancedListSettings;
						if (value) {
							if (!enabledStyles.includes(styleId)) {
								enabledStyles.push(styleId);
							}
						} else {
							this.plugin.settings.advancedListSettings.enabledStyles = enabledStyles.filter(s => s !== styleId);
						}
						
						// Ensure defaultStyle is still valid and enabled
						if (!this.plugin.settings.advancedListSettings.enabledStyles.includes(this.plugin.settings.advancedListSettings.defaultStyle)) {
							this.plugin.settings.advancedListSettings.defaultStyle = this.plugin.settings.advancedListSettings.enabledStyles[0] || 'bullet';
						}
						await this.plugin.saveSettings();
						// Refresh the display to update the dropdown for default list style
						this.display();
					}));
		}
	}
}
