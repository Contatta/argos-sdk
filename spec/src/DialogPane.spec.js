define('spec/DialogPane.spec', ['dojo/query','dojo/dom-class','argos/DialogPane'], function(query, domClass, DialogPane) {
    return describe('argos.DialogPane', function() {
        /**
         * buildRendering
         */
        it('Removes the default CSS class mblFixedSplitterPane upon initialization', function() {
            var pane = new DialogPane();
            expect(domClass.contains(pane.domNode, 'mblFixedSplitterPane')).toBe(false);
        });

        /**
         * _onToolbarPositionChange
         */
        it('Can remove the has-toolbar-(previous) CSS class from the dialog content node on toolbar position change when previous is defined', function() {
            var pane = new DialogPane();

            domClass.add(pane.dialogContentNode, 'has-toolbar-old');

            pane._onToolbarPositionChange('new', 'old');

            expect(domClass.contains(pane.dialogContentNode, 'old')).toBe(false);
        });
        it('Can add the new toolbar position CSS class to the dialog content node on toolbar position change', function() {
            var pane = new DialogPane();

            pane._onToolbarPositionChange('new');

            expect(domClass.contains(pane.dialogContentNode, 'has-toolbar-new')).toBe(true);
        });

        /**
         * show
         */
        it('Can call showDialog when isActive is false and show is called', function() {
            var pane = new DialogPane();

            spyOn(pane, 'showDialog');
            spyOn(pane, '_transition'); // stops from going further
            pane.isActive = false;

            pane.show({}, {});

            expect(pane.showDialog).toHaveBeenCalled();
        });
        it('Does not call showDialog when isActive is true and show is called', function() {
            var pane = new DialogPane();

            spyOn(pane, 'showDialog');
            spyOn(pane, '_transition'); // stops from going further
            pane.isActive = true;

            pane.show({}, {});

            expect(pane.showDialog).not.toHaveBeenCalled();
        });

        /**
         * showDialog
         */
        it('Can set the isActive flag to true when showDialog is called', function() {
            var pane = new DialogPane();
            pane.isActive = false;

            pane.showDialog();

            expect(pane.isActive).toBe(true);
        });
        it('Can remove the is-hidden class when showDialog is called', function() {
            var pane = new DialogPane();
            domClass.add(pane.domNode, 'is-hidden');

            pane.showDialog();

            expect(domClass.contains(pane.domNode, 'is-hidden')).toBe(false);
        });


        /**
         * hideDialog
         */
        it('Can set the isActive flag to false when hideDialog is called', function() {
            var pane = new DialogPane();
            pane.isActive = true;

            pane.hideDialog();

            expect(pane.isActive).toBe(false);
        });
        it('Can add the is-hidden class when hideDialog is called', function() {
            var pane = new DialogPane();
            domClass.remove(pane.domNode, 'is-hidden');

            pane.hideDialog();

            expect(domClass.contains(pane.domNode, 'is-hidden')).toBe(true);
        });

        /**
         * onPaneChange
         */
        it('Can call hideDialog when a new view is being shown in a different Pane and the DialogPane is still active', function() {
            var pane = new DialogPane();
            pane.isActive = true;

            spyOn(pane, 'hideDialog');

            var o = {
                tier: 0,
                pane: {}
            };
            pane.onPaneChange(o);

            expect(pane.hideDialog).toHaveBeenCalled();
        });
        it('Does not call hideDialog when a new view is being shown in a different Pane and the DialogPane is not active', function() {
            var pane = new DialogPane();
            pane.isActive = false;

            spyOn(pane, 'hideDialog');

            var o = {
                tier: 0,
                pane: {}
            };
            pane.onPaneChange(o);

            expect(pane.hideDialog).not.toHaveBeenCalled();
        });
        it('Does not call hideDialog when a new view is being shown in the same DialogPane', function() {
            var pane = new DialogPane();
            pane.isActive = false;

            spyOn(pane, 'hideDialog');

            var o = {
                tier: 0,
                pane: pane
            };
            pane.onPaneChange(o);

            expect(pane.hideDialog).not.toHaveBeenCalled();
        });


    });
});