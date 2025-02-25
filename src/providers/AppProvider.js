import { useReducer, useEffect, createContext } from "react";
import { actionTypes, PRODUCTS_LOCAL_STORAGE_KEY, CART_ITEMS_LOCAL_STORAGE_KEY } from "../constants";

import loadLocalStorageItems from "../utils/loadLocalStorageItems";
import useLocalStorage from "../hooks/useLocalStorage";
import * as api from "../api";

function buildNewCartItem(cartItem) {
	if (cartItem.quantity >= cartItem.unitsInStock) {
		return cartItem;
	}

	return {
		id: cartItem.id,
		title: cartItem.title,
		img: cartItem.img,
		price: cartItem.price,
		unitsInStock: cartItem.unitsInStock,
		createdAt: cartItem.createdAt,
		updatedAt: cartItem.updatedAt,
		quantity: cartItem.quantity + 1,
	};
}

function downVote(products, productId) {
	const updatedProducts = products.map((product) => {
		if (product.id === productId && product.votes.downVotes.currentValue < product.votes.downVotes.lowerLimit) {
			return {
				...product,
				votes: {
					...product.votes,
					downVotes: {
						...product.votes.downVotes,
						currentValue: product.votes.downVotes.currentValue + 1,
					},
				},
			};
		}

		return product;
	});

	return updatedProducts;
}

function upVote(products, productId) {
	const updatedProducts = products.map((product) => {
		if (product.id === productId && product.votes.upVotes.currentValue < product.votes.upVotes.upperLimit) {
			return {
				...product,
				votes: {
					...product.votes,
					upVotes: {
						...product.votes.upVotes,
						currentValue: product.votes.upVotes.currentValue + 1,
					},
				},
			};
		}

		return product;
	});

	return updatedProducts;
}

function setFavorite(products, productId) {
	const updatedProducts = products.map((product) => {
		if (product.id === productId) {
			return {
				...product,
				isFavorite: !product.isFavorite,
			};
		}

		return product;
	});

	return updatedProducts;
}

function saveNewProduct(products, newProduct) {
	return [newProduct, ...products];
}

function addCartItem(products, cartItems, productId) {
	const prevCartItem = cartItems.find((item) => item.id === productId);
	const foundProduct = products.find((product) => product.id === productId);

	if (prevCartItem) {
		const updatedCartItems = cartItems.map((item) => {
			if (item.id !== productId) {
				return item;
			}

			if (item.quantity >= item.unitsInStock) {
				return item;
			}

			return {
				...item,
				quantity: item.quantity + 1,
			};
		});

		return updatedCartItems;
	}

	const updatedProduct = buildNewCartItem(foundProduct);

	return [...cartItems, updatedProduct];
}

function editCartItem(cartItems, productId, quantity) {
	const updatedCartItems = cartItems.map((item) => {
		if (item.id === productId && item.quantity <= item.unitsInStock) {
			return {
				...item,
				quantity,
			};
		}

		return item;
	});

	return updatedCartItems;
}

function removeCartItem(cartItems, productId) {
	const updatedCartItems = cartItems.filter((item) => item.id !== productId);

	return updatedCartItems;
}

const initialState = {
	products: loadLocalStorageItems(PRODUCTS_LOCAL_STORAGE_KEY, []),
	cartItems: loadLocalStorageItems(CART_ITEMS_LOCAL_STORAGE_KEY, []),
	loading: {
		hasLoaded: false,
		hasError: false,
		loadingError: null,
	},
};

function reducer(state, action) {
	const { type, payload } = action;
	const { products, cartItems } = state;

	switch (type) {
		case actionTypes.PRODUCT_DOWNVOTE:
			return {
				...state,
				products: downVote(products, payload.id),
			};
		case actionTypes.PRODUCT_UPVOTE:
			return {
				...state,
				products: upVote(products, payload.id),
			};
		case actionTypes.PRODUCT_SET_FAVORITE:
			return {
				...state,
				products: setFavorite(products, payload.id),
			};
		case actionTypes.PRODUCT_SAVE_NEW_PRODUCT:
			return {
				...state,
				products: saveNewProduct(products, payload.product),
			};
		case actionTypes.CART_CLEAR:
			return {
				...state,
				cartItems: [],
			};
		case actionTypes.CARTITEM_ADD:
			return {
				...state,
				cartItems: addCartItem(products, cartItems, payload.id),
			};
		case actionTypes.CARTITEM_DELETE:
			return {
				...state,
				cartItems: removeCartItem(cartItems, payload.id),
			};
		case actionTypes.CARTITEM_EDIT:
			return {
				...state,
				cartItems: editCartItem(cartItems, payload.id, payload.quantity),
			};
		case actionTypes.LOADING_SUCCESS:
			return {
				...state,
				loading: {
					...state.loading,
					hasLoaded: true,
				},
				products: (payload && payload.data) || state.products,
			};
		case actionTypes.LOADING_ERROR:
			return {
				...state,
				loading: {
					hasLoaded: true,
					hasError: true,
					loadingError: payload.error.errorMessage,
				},
			};
		default:
			throw new Error();
	}
}

const AppContext = createContext();

function AppProvider({ children }) {
	const [state, dispatch] = useReducer(reducer, initialState);

	const { products, cartItems, loading } = state;

	useLocalStorage(products, PRODUCTS_LOCAL_STORAGE_KEY);
	useLocalStorage(cartItems, CART_ITEMS_LOCAL_STORAGE_KEY);

	useEffect(() => {
		if (products.length === 0) {
			api
				.getProducts()
				.then((data) => {
					dispatch({ type: actionTypes.LOADING_SUCCESS, payload: { data } });
				})
				.catch((error) => {
					dispatch({ type: actionTypes.LOADING_ERROR, payload: { error } });
				});
		} else {
			dispatch({ type: actionTypes.LOADING_SUCCESS });
		}
	}, []);

	return (
		<AppContext.Provider
			value={{
				products,
				cartItems,
				loading,
				handleDownVote: (id) => {
					dispatch({ type: actionTypes.PRODUCT_DOWNVOTE, payload: { id } });
				},
				handleUpVote: (id) => {
					dispatch({ type: actionTypes.PRODUCT_UPVOTE, payload: { id } });
				},
				handleSetFavorite: (id) => {
					dispatch({ type: actionTypes.PRODUCT_SET_FAVORITE, payload: { id } });
				},
				handleAddCartItem: (id) => {
					dispatch({ type: actionTypes.CARTITEM_ADD, payload: { id } });
				},
				handleRemoveCartItem: (id) => {
					dispatch({ type: actionTypes.CARTITEM_DELETE, payload: { id } });
				},
				handleEditCartItem: (id, quantity) => {
					dispatch({ type: actionTypes.CARTITEM_EDIT, payload: { id, quantity } });
				},
				handleSaveNewProduct: (product) => {
					dispatch({ type: actionTypes.PRODUCT_SAVE_NEW_PRODUCT, payload: { product } });
				},
				handleClearCart: () => {
					dispatch({ type: actionTypes.CART_CLEAR });
				},
			}}
		>
			{children}
		</AppContext.Provider>
	);
}

export { AppProvider, AppContext };
