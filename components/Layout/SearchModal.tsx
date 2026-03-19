/**
 * Search Modal Component
 * Search modal matching ECommerce.Web design
 */

'use client';

import React from 'react';

const SearchModal: React.FC = () => {
  return (
    <div
      id="search_modal"
      className="modal fixed-left fade"
      tabIndex={-1}
      role="dialog"
      aria-labelledby="searchModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-aside" role="document">
        <div className="modal-content">
          <div className="modal-header pt-2 pb-2">
            <h4>Search Our Site</h4>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="search_main_M">
              <div className="sarchmain">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    id="searchInput"
                    placeholder="Search for products"
                  />
                  <a href="#" className="search_btnn">
                    <img
                      className="img-fluid"
                      src="/assets/images/search_icon.png"
                      alt="Search"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;

