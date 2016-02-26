/**
 * External dependencies
 */
var React = require( 'react' ),
	classNames = require( 'classnames' ),
	connect = require( 'react-redux' ).connect,
	find = require( 'lodash/find' ),
	page = require( 'page' );

/**
 * Internal dependencies
 */
var activated = require( 'state/themes/actions' ).activated,
	Dispatcher = require( 'dispatcher' ),
	Card = require( 'components/card' ),
	HeaderCake = require( 'components/header-cake' ),
	Main = require( 'components/main' ),
	analytics = require( 'analytics' ),
	BusinessPlanDetails = require( './business-plan-details' ),
	ChargebackDetails = require( './chargeback-details' ),
	CheckoutThankYouHeader = require( './header' ),
	DomainMappingDetails = require( './domain-mapping-details' ),
	DomainRegistrationDetails = require( './domain-registration-details' ),
	getReceiptById = require( 'state/receipts/selectors' ).getReceiptById,
	GenericDetails = require( './generic-details' ),
	GoogleAppsDetails = require( './google-apps-details' ),
	isDomainMapping = require( 'lib/products-values' ).isDomainMapping,
	isDomainProduct = require( 'lib/products-values' ).isDomainProduct,
	isDomainRedemption = require( 'lib/products-values' ).isDomainRedemption,
	isDomainRegistration = require( 'lib/products-values' ).isDomainRegistration,
	isChargeback = require( 'lib/products-values' ).isChargeback,
	isBusiness = require( 'lib/products-values' ).isBusiness,
	isFreeTrial = require( 'lib/products-values' ).isFreeTrial,
	isGoogleApps = require( 'lib/products-values' ).isGoogleApps,
	isJetpackPlan = require( 'lib/products-values' ).isJetpackPlan,
	isJetpackPremium = require( 'lib/products-values' ).isJetpackPremium,
	isJetpackBusiness = require( 'lib/products-values' ).isJetpackBusiness,
	isPlan = require( 'lib/products-values' ).isPlan,
	isPremium = require( 'lib/products-values' ).isPremium,
	isSiteRedirect = require( 'lib/products-values' ).isSiteRedirect,
	isTheme = require( 'lib/products-values' ).isTheme,
	fetchReceipt = require( 'state/receipts/actions' ).fetchReceipt,
	refreshSitePlans = require( 'state/sites/plans/actions' ).refreshSitePlans,
	JetpackBusinessPlanDetails = require( './jetpack-business-plan-details' ),
	JetpackPremiumPlanDetails = require( './jetpack-premium-plan-details' ),
	plansPaths = require( 'my-sites/plans/paths' ),
	PremiumPlanDetails = require( './premium-plan-details' ),
	PurchaseDetail = require( './purchase-detail' ),
	SiteRedirectDetails = require( './site-redirect-details' ),
	upgradesPaths = require( 'my-sites/upgrades/paths' );

function getPurchases( props ) {
	return props.receipt.data.purchases;
}

var CheckoutThankYou = React.createClass( {
	componentDidMount: function() {
		this.redirectIfThemePurchased();
		this.refreshSitesAndSitePlansIfPlanPurchased();

		if ( this.props.receiptId && ! this.props.receipt.hasLoadedFromServer && ! this.props.receipt.isRequesting ) {
			this.props.fetchReceipt( this.props.receiptId );
		}

		analytics.tracks.recordEvent( 'calypso_checkout_thank_you_view' );
	},

	componentWillReceiveProps: function() {
		this.redirectIfThemePurchased();
		this.refreshSitesAndSitePlansIfPlanPurchased();
	},

	refreshSitesAndSitePlansIfPlanPurchased: function() {
		if ( this.props.receipt.hasLoadedFromServer && getPurchases( this.props ).some( isPlan ) ) {
			// Refresh selected site plans if the user just purchased a plan
			this.props.refreshSitePlans( this.props.selectedSite.ID );

			// Refresh the list of sites to update the `site.plan` property
			// needed to display the plan name on the right of the `Plans` menu item
			Dispatcher.handleViewAction( {
				type: 'FETCH_SITES'
			} );
		}
	},

	isDataLoaded: function() {
		return ! this.props.receiptId || this.props.receipt.hasLoadedFromServer;
	},

	redirectIfThemePurchased: function() {
		if ( this.props.receipt.hasLoadedFromServer && getPurchases( this.props ).every( isTheme ) ) {
			this.props.activatedTheme( getPurchases( this.props )[ 0 ].meta, this.props.selectedSite );
			page.redirect( '/design/' + this.props.selectedSite.slug );
			return;
		}
	},

	goBack() {
		if ( this.isDataLoaded() ) {
			const purchases = getPurchases( this.props );

			if ( purchases.some( isPlan ) ) {
				page( plansPaths.plans( this.props.selectedSite.slug ) );
			} else if ( purchases.some( isDomainProduct ) || purchases.some( isDomainRedemption || purchases.some( isSiteRedirect ) ) ) {
				page( upgradesPaths.domainManagementList( this.props.selectedSite.slug ) );
			} else if ( purchases.some( isGoogleApps ) ) {
				page( upgradesPaths.domainManagementEmail( this.props.selectedSite.slug ) );
			}
		} else {
			page( `/stats/insights/${ this.props.selectedSite.slug }` );
		}
	},

	render: function() {
		var classes = classNames( 'checkout-thank-you', {
			'is-placeholder': ! this.isDataLoaded()
		} );

		return (
			<Main className={ classes }>
				<HeaderCake onClick={ this.goBack } isCompact backText={ this.translate( 'Back to my site' ) } />

				<Card className="checkout-thank-you__content">
					{ this.productRelatedMessages() }
				</Card>

				<Card className="checkout-thank-you__get-support">
					<div className="checkout-thank-you__get-support-text">
						<h3 className="checkout-thank-you__support-heading">
							{ this.translate( 'Questions? Need Help?' ) }
						</h3>
						<p className="checkout-thank-you__support-related-messages">
							{ this.supportRelatedMessages() }
						</p>
					</div>
				</Card>
			</Main>
		);
	},

	freeTrialWasPurchased: function() {
		if ( ! this.isDataLoaded() ) {
			return false;
		}

		return getPurchases( this.props ).some( isFreeTrial );
	},

	jetpackPlanWasPurchased: function() {
		if ( ! this.props.receiptId ) {
			return false;
		}

		return getPurchases( this.props ).some( isJetpackPlan );
	},

	/**
	 * Retrieves the component (and any corresponding data) that should be displayed according to the type of purchase
	 * just performed by the user.
	 *
	 * @returns {*[]} an array of varying size with the component instance, then an optional purchase object possibly followed by a domain name
	 */
	getComponentAndPrimaryPurchaseAndDomain: function() {
		if ( this.isDataLoaded() ) {
			const purchases = getPurchases( this.props );

			const findPurchaseAndDomain = ( purchases, predicate ) => {
				const purchase = find( purchases, predicate );

				return [ purchase, purchase.meta ];
			};

			if ( purchases.some( isJetpackPremium ) ) {
				return [ JetpackPremiumPlanDetails, find( purchases, isJetpackPremium ) ];
			} else if ( purchases.some( isJetpackBusiness ) ) {
				return [ JetpackBusinessPlanDetails, find( purchases, isJetpackBusiness ) ];
			} else if ( purchases.some( isPremium ) ) {
				return [ PremiumPlanDetails, find( purchases, isPremium ) ];
			} else if ( purchases.some( isBusiness ) ) {
				return [ BusinessPlanDetails, find( purchases, isBusiness ) ];
			} else if ( purchases.some( isGoogleApps ) ) {
				return [ GoogleAppsDetails, ...findPurchaseAndDomain( purchases, isGoogleApps ) ];
			} else if ( purchases.some( isDomainRegistration ) ) {
				return [ DomainRegistrationDetails, ...findPurchaseAndDomain( purchases, isDomainRegistration ) ];
			} else if ( purchases.some( isDomainMapping ) ) {
				return [ DomainMappingDetails, ...findPurchaseAndDomain( purchases, isDomainMapping ) ];
			} else if ( purchases.some( isSiteRedirect ) ) {
				return [ SiteRedirectDetails, ...findPurchaseAndDomain( purchases, isSiteRedirect ) ];
			} else if ( purchases.some( isChargeback ) ) {
				return [ ChargebackDetails, find( purchases, isChargeback ) ];
			}
		}

		return [ GenericDetails ];
	},

	productRelatedMessages: function() {
		var selectedSite = this.props.selectedSite,
			[ ComponentClass, primaryPurchase, domain ] = this.getComponentAndPrimaryPurchaseAndDomain();

		if ( ! this.isDataLoaded() ) {
			return (
				<div>
					<CheckoutThankYouHeader
						isDataLoaded={ false }
						selectedSite={ this.props.selectedSite } />
					<PurchaseDetail isPlaceholder />
					<PurchaseDetail isPlaceholder />
					<PurchaseDetail isPlaceholder />
				</div>
			);
		}

		return (
			<div>
				<CheckoutThankYouHeader
					isDataLoaded={ this.isDataLoaded() }
					primaryPurchase={ primaryPurchase }
					selectedSite={ this.props.selectedSite } />

				<div className="checkout-thank-you__features-header">
					{ this.translate( "Get started with your site's new features" ) }
				</div>

				<div className="checkout-thank-you__purchase-details-list">
					<ComponentClass
						selectedSite={ selectedSite }
						isFreeTrial={ this.freeTrialWasPurchased() }
						domain={ domain } />
				</div>
			</div>
		);
	},

	supportRelatedMessages: function() {
		if ( ! this.isDataLoaded() ) {
			return this.translate( 'Loading…' );
		}

		if ( this.jetpackPlanWasPurchased() ) {
			return this.translate(
				'Check out our {{supportDocsLink}}support docs{{/supportDocsLink}} ' +
				'or {{contactLink}}contact us{{/contactLink}}.',
				{
					components: {
						supportDocsLink: <a href={ 'http://jetpack.me/support/' } target="_blank" />,
						contactLink: <a href={ 'http://jetpack.me/contact-support/' } target="_blank" />
					}
				}
			);
		}

		return this.translate(
			'Check out our {{supportDocsLink}}support docs{{/supportDocsLink}}, ' +
			'search for tips and tricks in {{forumLink}}the forum{{/forumLink}}, ' +
			'or {{contactLink}}contact us{{/contactLink}}.',
			{
				components: {
					supportDocsLink: <a href="http://support.wordpress.com" target="_blank" />,
					forumLink: <a href="http://forums.wordpress.com" target="_blank" />,
					contactLink: <a href={ '/help/contact' } />
				}
			}
		);
	}
} );

module.exports = connect(
	function mapStateToProps( state, props ) {
		return {
			receipt: getReceiptById( state, props.receiptId )
		};
	},
	function mapDispatchToProps( dispatch ) {
		return {
			activatedTheme: function( meta, selectedSite ) {
				dispatch( activated( meta, selectedSite, 'calypstore', true ) );
			},
			fetchReceipt: function( receiptId ) {
				dispatch( fetchReceipt( receiptId ) );
			},
			refreshSitePlans: function( siteId ) {
				dispatch( refreshSitePlans( siteId ) );
			}
		};
	}
)( CheckoutThankYou );
