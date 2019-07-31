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

const { ItineraryDialog, ITINERARY_DIALOG } = require('./itineraryDialog');
const { CreateMeetingDialog, CREATE_MEETING_DIALOG } = require('./createMeetingDialog');

const HANDLER_DIALOG = 'HANDLER_DIALOG';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'HANDLER_WATERFALL_DIALOG';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

class HandlerDialog extends ComponentDialog {
    constructor(userState) {
        super(HANDLER_DIALOG);
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        this.addDialog(new ItineraryDialog());
        this.addDialog(new CreateMeetingDialog());

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.dialogSelectionStep.bind(this),
            this.callSelectedDialogStep.bind(this),
            this.askIfMoreHelpNeededStep.bind(this),
            this.handleMoreHelpResponse.bind(this),
            this.finalStep.bind(this)
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

    async dialogSelectionStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'What can I help you with?',
            choices: ChoiceFactory.toChoices(['Create New Meeting', 'See Agenda'])
        });
    }

    async callSelectedDialogStep(step) {
        if (step.result.value === 'Create New Meeting') {
            return await step.beginDialog(CREATE_MEETING_DIALOG);
        } else {
            return await step.beginDialog(ITINERARY_DIALOG);
        }
    }

    async askIfMoreHelpNeededStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'What can I help you with anything else?',
            choices: ChoiceFactory.toChoices(['Yes', 'No'])
        });
    }

    async handleMoreHelpResponse(step) {
        console.log(step);
        if (step.result.value === 'Yes') {
            return await step.replaceDialog(HANDLER_DIALOG);
        } else {
            return await step.context.sendActivity('Ok! Send me a message if you need anything 👍');
        }
    }

    async finalStep(step) {
        return await step.endDialog();
    }
}

module.exports.HandlerDialog = HandlerDialog;
module.exports.HANDLER_DIALOG = HANDLER_DIALOG;
