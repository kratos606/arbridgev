import React from 'react'

export default function RedirectToChrome() {
    return (
      <div>
        <button
          onClick={() =>
            (window.location.href =
              "googlechromes://art.ardisplay.io/model/ff")
          }
        >
          Redirect to chrome
        </button>
      </div>
    );
}