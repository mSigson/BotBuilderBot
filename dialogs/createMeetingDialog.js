// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'CREATE_MEETING_WATERFALL_DIALOG';
const CREATE_MEETING_DIALOG = 'CREATE_MEETING_DIALOG';

class CreateMeetingDialog extends ComponentDialog {
    constructor() {
        super(CREATE_MEETING_DIALOG);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.channelTypeSelectionStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async channelTypeSelectionStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'What kind of meeting would you like to create?',
            choices: ChoiceFactory.toChoices(['One-on-one', 'Team'])
        });
    }
}

module.exports.CreateMeetingDialog = CreateMeetingDialog;
module.exports.CREATE_MEETING_DIALOG = CREATE_MEETING_DIALOG;
