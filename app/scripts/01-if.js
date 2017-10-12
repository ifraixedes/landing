'use strict';

(function (win, doc) {
  var FORM_REDIRECTOR_URL = 'https://data2googleforms.herokuapp.com/ivan-fraixed-es';
  var formElem = doc.getElementById('contactForm');
  var formSectionElem = doc.getElementById('contactFormSection');
  var submitOkElem = doc.getElementById('contactFormSentOK');
  var submitNoOkElem = doc.getElementById('contactFormSentNoOK');

  function getContactFormData(fieldsNames) {
    var dataPairsList = [];
    var idx = 0;
    var fields = null;

    for (idx = 0; idx < fieldsNames.length; idx++) {
      fields = formElem.querySelectorAll('[name="' + fieldsNames[idx] + '"]');
      if (fields.length > 1) {
        dataPairsList.push([fieldsNames[idx], getValueFromRadioElems(fields)]);
      } else {
        dataPairsList.push([fieldsNames[idx], fields[0].value]);
      }
    }

    return xWWWUrlEncode(dataPairsList);
  }

  function sendContactFormData(url, encData) {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener('load', function () {
      toggleClass(formSectionElem, 'if-hide');
      toggleClass(submitOkElem, 'if-hide');
    });

    // We define what will happen in case of error
    xhr.addEventListener('error', function () {
      toggleClass(formSectionElem, 'if-hide');
      toggleClass(submitNoOkElem, 'if-hide');
    });

    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(encData);
  }

  function xWWWUrlEncode(pairsList) {
    var encDataPairs = [];
    var idx = 0;

    for (idx = 0; idx < pairsList.length; idx++) {
      encDataPairs.push(encodeURIComponent(pairsList[idx][0]) + '=' + encodeURIComponent(pairsList[idx][1]));
    }

    return encDataPairs.join('&').replace(/%20/g, '+');
  }

  function getValueFromRadioElems(elems) {
    var idx = 0;

    for (idx = 0; idx < elems.length; idx++) {
      if (elems[idx].checked) {
        return elems[idx].value;
      }
    }

    return null;
  }

  function toggleClass(elem, className) {
    var c = elem.className;

    if (c.match('\\b' + className + '\\b')) {
      elem.className = c.replace(className, '');
    } else {
      elem.className += ' ' + className;
    }

    return elem;
  }

  win.getFormBackWhenError = function getFormBackWhenError() {
    toggleClass(formSectionElem, 'if-hide');
    toggleClass(submitNoOkElem, 'if-hide');
  };

  H5F.setup(doc.getElementById('contactForm'), {
    onSubmit: function (evt) {
      evt.preventDefault();
      var data = getContactFormData(['entry.908361296', 'entry.135193594', 'entry.1512787164', 'entry.104139423']);
      sendContactFormData(FORM_REDIRECTOR_URL, data);
    }
  });
})(window, document);
