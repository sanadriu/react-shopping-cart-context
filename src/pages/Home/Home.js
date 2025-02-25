import React, { useContext } from "react";

import ProductsListing from "../../components/ProductsListing";
import Cart from "../../components/Cart";
import withLayout from "../../hoc/withLayout";
import { AppContext } from "../../providers/AppProvider";

function Home() {
	const {
		products,
		cartItems,
		loading: { hasLoaded, hasError, loadingError },
	} = useContext(AppContext);

	return (
		<div className="row">
			<div className="col col-8">
				<div className="row">
					<div className="col col-12">
						<header className="jumbotron">
							<h1 className="display-4">Shoe shop</h1>
							<p className="lead">This is the best shoe shop ever, you will never find a better one.</p>
							<p className="font-weight-bold">Buy now!</p>
						</header>
					</div>
					{!hasLoaded && (
						<div className="col col-12">
							<h2>Loading products...</h2>
						</div>
					)}
					{hasLoaded && hasError && (
						<div className="col col-12">
							<h2>Something went wrong...</h2>
							<pre>
								<code>{loadingError}</code>
							</pre>
						</div>
					)}
					{hasLoaded && !hasError && (
						<div className="col col-12">
							<ProductsListing />
						</div>
					)}
				</div>
			</div>

			<Cart className="col col-4" />
		</div>
	);
}

export default withLayout(Home);
