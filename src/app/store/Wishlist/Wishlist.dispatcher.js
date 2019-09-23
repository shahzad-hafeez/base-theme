/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/base-theme
 */

import { fetchMutation, fetchQuery } from 'Util/Request';
import {
    updateIsLoading,
    removeItemFromWishlist,
    updateAllProductsInWishlist
} from 'Store/Wishlist';
import { showNotification } from 'Store/Notification';
import { isSignedIn } from 'Util/Auth';
import { WishlistQuery } from 'Query';

/**
 * Product Wishlist Dispatcher
 * @class WishlistDispatcher
 */
export class WishlistDispatcher {
    updateInitialWishlistData(dispatch) {
        if (isSignedIn()) {
            this._syncWishlistWithBE(dispatch);
        } else {
            dispatch(updateAllProductsInWishlist({}));
        }
    }

    _syncWishlistWithBE(dispatch) {
        // Need to get current wishlist from BE, update wishlist
        return fetchQuery(WishlistQuery.getWishlistQuery()).then(
            (data) => {
                if (data && data.wishlist && data.wishlist.items_count) {
                    const { wishlist } = data;
                    const productsToAdd = wishlist.items.reduce((prev, wishlistItem) => {
                        const { product, sku, id: item_id } = wishlistItem;

                        return {
                            ...prev,
                            [sku]: {
                                ...product,
                                item_id
                            }
                        };
                    }, {});

                    dispatch(updateAllProductsInWishlist(productsToAdd));
                } else {
                    dispatch(updateIsLoading(false));
                }
            },
            // eslint-disable-next-line no-console
            error => console.log(error)
        );
    }

    addItemToWishlist(dispatch, wishlistItem) {
        dispatch(updateIsLoading(true));

        return fetchMutation(WishlistQuery.getAddProductToWishlistMutation(wishlistItem)).then(
            () => this._syncWishlistWithBE(dispatch).then(
                () => dispatch(showNotification('success', __('Product has been added to your Wish List!')))
            ),
            // eslint-disable-next-line no-console
            error => dispatch(showNotification('error', __('Error updating wish list!'))) && console.log(error)
        );
    }

    removeItemFromWishlist(dispatch, { item_id, sku, noMessages }) {
        if (!item_id) return null;
        dispatch(updateIsLoading(true));

        if (noMessages) {
            return fetchMutation(WishlistQuery.getRemoveProductFromWishlistMutation(item_id)).then(
                () => {
                    dispatch(removeItemFromWishlist(sku));
                }
            );
        }

        return fetchMutation(WishlistQuery.getRemoveProductFromWishlistMutation(item_id)).then(
            () => {
                dispatch(removeItemFromWishlist(sku));
                dispatch(showNotification('success', __('Product has been removed from your Wish List!')));
            },
            (error) => {
                dispatch(showNotification('error', __('Error updating wish list!')));
                // eslint-disable-next-line no-console
                console.log(error);
            }
        );
    }
}

export default new WishlistDispatcher();
