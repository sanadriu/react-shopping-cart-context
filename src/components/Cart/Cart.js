import { useContext, useState } from "react";
import { AppContext } from "../../providers/AppProvider";
import { Redirect } from "react-router";

import ShoppingCartItem from "../ShoppingCartItem";
import Button from "../Button";

import getCartTotal from "../../utils/getCartTotal";

function Cart({ ...props }) {
	const { cartItems } = useContext(AppContext);
	const [redirect, setRedirect] = useState(false);

	return (
		<>
			{redirect && <Redirect to="/checkout" />}
			<aside {...props}>
				<div className="row flex-column">
					<div className="col shopping__cart__header">
						<h2 className="h3 mt-2">Shopping Cart</h2>
						<hr className="mb-3" />
					</div>

					{cartItems.length > 0 ? (
						cartItems.map((item) => (
							<ShoppingCartItem
								key={item.id}
								id={item.id}
								title={item.title}
								price={item.price}
								img={item.img}
								quantity={item.quantity}
								unitsInStock={item.unitsInStock}
							/>
						))
					) : (
						<div className="col mb-4">
							<h4>Your cart is empty</h4>
						</div>
					)}
					<div className="col">
						<div className="row row-cols-1 flex-column">
							<div className="col">
								<div className="d-flex justify-content-between">
									<h4 className="h5">Total</h4>
									<h4>
										<strong>{getCartTotal(cartItems)}€</strong>
									</h4>
								</div>
								<hr />
							</div>
							<div className="col">
								<Button disabled={cartItems.length === 0} onClick={() => setRedirect(true)}>
									Checkout
								</Button>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</>
	);
}

export default Cart;
