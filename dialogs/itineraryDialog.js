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

const { CardFactory } = require('botbuilder');
const AdaptiveCard = require('../resources/adaptiveCard.json');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'ITINERARY_WATERFALL_DIALOG';
const ITINERARY_DIALOG = 'ITINERARY_DIALOG';

class ItineraryDialog extends ComponentDialog {
    constructor() {
        super(ITINERARY_DIALOG);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.selectMeetingStep.bind(this),
            this.selectMeetingAction.bind(this),
            this.handleMeetingAction.bind(this),
            this.finishDialog.bind(this)
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

    async selectMeetingStep(step) {
        await step.context.sendActivity('You have two meetings coming up today!');
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Which would you like to see more about?',
            choices: ChoiceFactory.toChoices(['tom', 'Awesome Team Meeting'])
        });
    }

    async selectMeetingAction(step) {
        await step.context.sendActivity({ attachments: [this.createThumbnailCard(step.result.value)] });
        return await step.prompt(CHOICE_PROMPT, {
            choices: ChoiceFactory.toChoices(['Show Agenda', 'Go to Inbox', 'Insights', 'Back'])
        });
    }

    async handleMeetingAction(step) {
        const { value } = step.result;
        if (value === 'Back') { return await step.replaceDialog(ITINERARY_DIALOG); }
        if (value === 'Insights') { return await step.context.sendActivity({ attachments: [this.createHeroCard()] }); }
        if (value === 'Show Agenda') { return await step.context.sendActivity({ attachments: [this.createAdaptiveCard()] }); }
    }

    async finishDialog(step) {
        return await step.endDialog();
    }

    createHeroCard() {
        //  image removal link --> https://postimg.cc/delete/bKFqGSC3/1ac0f754
        return CardFactory.heroCard(undefined, ['https://i.postimg.cc/SsDmNNRX/insights.png']);
    }

    createThumbnailCard(channel) {
        return CardFactory.thumbnailCard(
            channel,
            ['https://cdn.jsdelivr.net/emojione/assets/4.0/png/128/1f44b.png']
        );
    }

    createAdaptiveCard() {
        return CardFactory.adaptiveCard(AdaptiveCard);
    }
}

module.exports.ItineraryDialog = ItineraryDialog;
module.exports.ITINERARY_DIALOG = ITINERARY_DIALOG;
