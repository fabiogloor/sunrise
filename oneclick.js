(function (/* root, doc */) {


    // Funktion zum Initialisieren der Event Listener
    function initializeDynamicSubmit() {
        document.addEventListener("click", handleDynamicSubmitClick);
    }

    // Funktion zur Behandlung des Klick-Ereignisses
    function handleDynamicSubmitClick(event) {
        var target = event.target;

        while (target && !target.classList.contains('dynamic-submit')) {
            target = target.parentElement;
        }

        if (target && target.classList.contains('dynamic-submit')) {
            event.preventDefault();

            var actionValue = target.getAttribute('data-action') || '';
            var cicIdValue = target.getAttribute('data-cicid') || '';
            var formAction = target.getAttribute('data-target') || '';

            createAndSubmitForm(actionValue, cicIdValue, formAction, target);
        }
    }

    // Funktion zum Erstellen und Absenden des Formulars
    function createAndSubmitForm(actionValue, cicIdValue, formAction = "", sourceElement = null) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = formAction;

        var actionInput = document.createElement('input');
        actionInput.type = 'hidden';
        actionInput.name = 'action';
        actionInput.value = actionValue;
        form.appendChild(actionInput);

        var cicIdInput = document.createElement('input');
        cicIdInput.type = 'hidden';
        cicIdInput.name = 'cicId';
        cicIdInput.value = cicIdValue;
        form.appendChild(cicIdInput);

        if (sourceElement) {
            Array.from(sourceElement.attributes).forEach(attr => {
                if (attr.name.startsWith("data-extra-")) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = attr.name.replace("data-extra-", ""); // z. B. otoid
                    input.value = attr.value;
                    form.appendChild(input);
                }
            });
        }

        document.body.appendChild(form);

        form.submit();
    }

    // Anzeigen/Ausblenden des Modals
    function initializeModalVisibility() {
        var modal = document.querySelector(".modal-section");
        if (!modal) return;

        modal.classList.add("modal-show");

        setTimeout(function() {
            modal.classList.remove("modal-show");
            modal.classList.add("modal-hide");
        }, 12000);
    }


    document.addEventListener("DOMContentLoaded", function() {
        initializeDynamicSubmit();
        initializeModalVisibility();
    });


}(window, document));
