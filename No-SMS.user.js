// ==UserScript==
// @name          No-SMS
// @author        Lcf.vs <https://github.com/Lcfvs>
// @licence       MIT
// @description   Rewrites the SMS by true words
// @include       http://chat.developpez.com/*
// @version       0.9.1
// @downloadURL   https://raw.githubusercontent.com/Lcfvs/dvp-userscripts/master/No-SMS.user.js
// @updateURL     https://raw.githubusercontent.com/Lcfvs/dvp-userscripts/master/No-SMS.user.js
// @website       https://github.com/Lcfvs/dvp-userscripts
// ==/UserScript==
void function (callback) {
    var body,
        script;

    body = document.body;
    script = document.createElement('script');
    script.textContent = 'void ' + callback.toString() + '(window);';
    body.appendChild(script);
    body.removeChild(script);
}(function (global) {
    'use strict';

    var god,
        prototype,
        open,
        send,
        parseSession,
        loadDictionnary,
        normalize,
        parse,
        addUI,
        openUI,
        addSMS,
        session,
        dictionnary;

    god = '%41%6E%6F%6D%61%6C%79';
    prototype = global.XMLHttpRequest.prototype;
    open = prototype.open;
    send = prototype.send;

    prototype.open = function (method, url) {
        var instance;

        instance = this;
        instance.requestedUrl = url;

        open.apply(instance, arguments);

        if (!session) {
            instance.addEventListener('load', parseSession);
        }
    };

    parseSession = function parseSession() {
        try {
            session = JSON.parse(this.responseText).session;
            loadDictionnary(addUI);
        } catch (error) {}
    };

    loadDictionnary = function loadDictionnary(callback) {
        var xhr;

        if (!session) {
            return;
        }

        xhr = new XMLHttpRequest();

        xhr.addEventListener('load', callback);

        xhr.open('get', 'https://api.dvp.io/sms/?sid=' + session, true);
        xhr.send();
    };

    prototype.send = function (data) {
        var instance,
            str,
            start,
            end,
            value;

        instance = this;
        str = data;

        if (dictionnary && instance.requestedUrl === 'ajax.php' && typeof str === 'string') {
            start = str.indexOf('c=') + 2;

            if (start > 1) {
                end = str.lastIndexOf('&a=');
                value = normalize(str.substring(start, end));
                str = str.substr(0, start) + value + str.substr(end);
            }
        }

        send.call(instance, str);
    };

    normalize = function normalize(value) {
        var str,
            index,
            message,
            rest;

        str = decodeURIComponent(value.replace(/\+/g, '%20'));
        index = str.search(/\[(?:quote|code){1}\]/i);

        if (index > -1) {
            message = str.substring(0, index);
            rest = str.substring(index);
        } else {
            message = str;
            rest = '';
        }

        str = parse(message) + rest;
        str = encodeURIComponent(str).replace(/%20/g, '+')

        return str;
    };

    parse = function parse(data) {
        var words,
            length,
            iterator,
            sms,
            word,
            isGod;

        words = data.split(' ');
        length = words.length;
        iterator = 0;

        for (; iterator < length; iterator += 1) {
            sms = words[iterator].toLowerCase();

            if (dictionnary.hasOwnProperty(sms)) {
                word = dictionnary[sms];

                isGod = sms === 'dieu'
                && word === god;

                if (iterator && isGod) {
                    previousWord = words[iterator - 1];
                    word = decodeURIComponent(word);
                    
                    if (previousWord === 'de') {
                        words[iterator - 1] = '';
                        word = 'd\'' + word;
                    }
                    
                    if (previousWord === 'que') {
                        words[iterator - 1] = '';
                        word = 'qu\'' + word;
                    }
                }

                words[iterator] = word;
            }
        }

        return words.join(' ');
    };

    addUI = function addUI() {
        var container,
            button,
            div,
            dl;

        dictionnary = JSON.parse(this.responseText).data;
        container = document.getElementById('barreOutils');
        button = document.createElement('input');

        button.type = 'button';
        button.classList.add('bouton');
        button.value = 'No-SMS';

        div = document.createElement('div');
        div.innerHTML = '<div aria-labelledby="ui-dialog-title-dialogueSMS" \
        role="dialog" tabindex="-1" class="ui-dialog ui-widget \
        ui-widget-content ui-corner-all ui-draggable" style="display: none;\
        z-index: 1009; outline: 0px none; height: auto; width: 530px; top: \
        153px; left: 424px;"><div class="ui-dialog-titlebar ui-widget-header\
        ui-corner-all ui-helper-clearfix"><span \
        id="ui-dialog-title-dialogueSMS" class="ui-dialog-title">Gestion de \
        réécriture des SMS</span><a role="button" \
        class="ui-dialog-titlebar-close ui-corner-all" href="#"><span \
        class="ui-icon ui-icon-closethick">close</span></a></div><div \
        scrollleft="0" scrolltop="0" style="display: block; width: auto; \
        min-height: 0px; height: 200px;" id="dialogueSMS" class="boiteDialogue\
        ui-dialog-content ui-widget-content"><table><tbody><tr><td \
        style="text-align: left">Nouveau SMS :&nbsp;</td><td><input \
        id="dlgSMS" style="width: 300px" type="text"></td></tr><tr><td \
        style="text-align: left">Mot correspondant :&nbsp;</td><td><input \
        id="dlgWord" style="width: 300px" type="text"></td></tr></tbody>\
        </table><p class="valider" style="width: 470px"><input \
        id="dlgSMSAction" value="Insérer" class="bouton" type="button"></p><p>\
        Paires déjà enregistrées :</p><p><dl style="width: 510px; height: \
        120px; overflow: auto;"></dl></p></div></div>';

        div = div.childNodes[0];
        dl = div.querySelector('dl');

        button.addEventListener('click', openUI.bind(null, div, dl), false);

        div.querySelector('.ui-dialog-titlebar-close')
            .addEventListener('click', function () {
                div.style.display = 'none';
            }, false);

        div.querySelector('#dlgSMSAction')
            .addEventListener('click', addSMS.bind(null, div, dl), false);

        container.appendChild(button);
        document.body.appendChild(div);
    };

    openUI = function openUI(container, dl) {
        loadDictionnary(function () {
            try {
                dictionnary = JSON.parse(this.responseText).data;
                dl.innerHTML = '';

                Object.keys(dictionnary).forEach(function (sms) {
                    var word,
                        dt,
                        dd;

                    word = dictionnary[sms];

                    if (sms === 'dieu' && word === god) {
                        return;
                    }

                    dt = document.createElement('dt');
                    dd = document.createElement('dd');
                    dt.appendChild(document.createTextNode(sms + ' : '));
                    dd.appendChild(document.createTextNode(word));

                    dt.style.cssText = 'float: left; clear: left; width: 100px;'

                    dl.appendChild(dt);
                    dl.appendChild(dd);
                });

                container.style.display = 'block';
            } catch (error) {};
        });
    };

    addSMS = function addSMS(div, dl, event) {

    };
});

document.getElementById('identAction').click();
