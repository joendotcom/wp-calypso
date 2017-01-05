/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { localize } from 'i18n-calypso';
import { connect } from 'react-redux';
import { pick, map } from 'lodash';

/**
 * Internal dependencies
 */
import { protectForm } from 'lib/protect-form';
import SectionHeader from 'components/section-header';
import Card from 'components/card';
import Button from 'components/button';
import JetpackModuleToggle from '../jetpack-module-toggle';
import FormFieldset from 'components/forms/form-fieldset';
import FormToggle from 'components/forms/form-toggle';
import QueryJetpackModules from 'components/data/query-jetpack-modules';
import QueryJetpackSettings from 'components/data/query-jetpack-settings';
import { getSelectedSiteId } from 'state/ui/selectors';
import { isModuleActive, isFetchingModules } from 'state/jetpack-settings/modules/selectors';
import {
	getJetpackSettings,
	isRequestingJetpackSettings,
	isUpdatingJetpackSettings
} from 'state/jetpack-settings/settings/selectors';
import { updateSettings } from 'state/jetpack-settings/settings/actions';
import InfoPopover from 'components/info-popover';
import ExternalLink from 'components/external-link';

class ThemeEnhancements extends Component {
	constructor( props ) {
		super( props );

		this.state = {};

		this.onSubmitForm = this.onSubmitForm.bind( this );
	}

	componentWillReceiveProps( nextProps ) {
		map( nextProps.moduleSettings, ( settingValue, settingName ) => {
			if ( ! this.state.hasOwnProperty( settingName ) ) {
				this.setState( { [ settingName ]: settingValue } );
			}
		} );
	}

	sanitizeFieldValue( fieldName, fieldValue ) {
		switch ( fieldName ) {
			case 'wp_mobile_excerpt':
			case 'wp_mobile_featured_images':
				return fieldValue ? 'enabled' : 'disabled';
		}

		return fieldValue;
	}

	isFieldTruthy( fieldName ) {
		switch ( fieldName ) {
			case 'wp_mobile_excerpt':
			case 'wp_mobile_featured_images':
				return this.state[ fieldName ] === 'enabled';
		}

		return !! this.state[ fieldName ];
	}

	handleToggle( name ) {
		return () => {
			this.setState( {
				[ name ]: this.sanitizeFieldValue( name, ! this.isFieldTruthy( name ) )
			} );
		};
	}

	onSubmitForm( event ) {
		const { onSubmitForm, selectedSiteId } = this.props;

		this.props.updateSettings( selectedSiteId, this.state );

		onSubmitForm( event );
	}

	render() {
		const {
			fetchingSettings,
			fetchingModuleData,
			submittingForm,
			updatingSettings,
			selectedSiteId,
			infiniteScrollModuleActive,
			minilevenModuleActive,
			translate
		} = this.props;
		const isFormPending = fetchingSettings || fetchingModuleData || submittingForm || updatingSettings;

		return (
			<div>
				<QueryJetpackModules siteId={ selectedSiteId } />
				<QueryJetpackSettings siteId={ selectedSiteId } />

				<SectionHeader label={ translate( 'Theme Enhancements' ) }>
					<Button
						compact
						primary
						onClick={ this.onSubmitForm }
						disabled={ isFormPending }>
						{ submittingForm ? translate( 'Saving…' ) : translate( 'Save Settings' ) }
					</Button>
				</SectionHeader>
				<Card className="theme-enhancements__card site-settings">
					<FormFieldset>
						<div className="theme-enhancements__info-link-container">
							<InfoPopover position={ 'left' }>
								<ExternalLink icon={ true } href={ 'https://jetpack.com/support/infinite-scroll' } target="_blank">
									{ translate( 'Learn more about Infinite Scroll' ) }
								</ExternalLink>
							</InfoPopover>
						</div>

						<JetpackModuleToggle
							siteId={ selectedSiteId }
							moduleSlug="infinite-scroll"
							label={ translate( 'Add support for infinite scroll to your theme.' ) }
							/>

						{
							infiniteScrollModuleActive && (
								<div className="theme-enhancements__module-settings is-indented">
									<FormToggle
										className="theme-enhancements__module-settings-toggle is-compact"
										checked={ this.isFieldTruthy( 'infinite_scroll' ) }
										disabled={ isFormPending }
										onChange={ this.handleToggle( 'infinite_scroll' ) }>
										<span>
											{ translate(
												'Scroll infinitely (Shows 7 posts on each load)'
											) }
										</span>
									</FormToggle>

									<FormToggle
										className="theme-enhancements__module-settings-toggle is-compact"
										checked={ this.isFieldTruthy( 'infinite_scroll_google_analytics' ) }
										disabled={ isFormPending }
										onChange={ this.handleToggle( 'infinite_scroll_google_analytics' ) }>
										<span>
											{ translate(
												'Track each infinite Scroll post load as a page view in Google Analytics'
											) }
										</span>
									</FormToggle>
								</div>
							)
						}
					</FormFieldset>

					<FormFieldset>
						<div className="theme-enhancements__info-link-container">
							<InfoPopover position={ 'left' }>
								<ExternalLink icon={ true } href={ 'https://jetpack.com/support/mobile-theme' } target="_blank">
									{ translate( 'Learn more about the Mobile Theme' ) }
								</ExternalLink>
							</InfoPopover>
						</div>

						<JetpackModuleToggle
							siteId={ selectedSiteId }
							moduleSlug="minileven"
							label={ translate( 'Optimize your site with a phone-friendly theme.' ) }
							/>

						{
							minilevenModuleActive && (
								<div className="theme-enhancements__module-settings is-indented">
									<FormToggle
										className="theme-enhancements__module-settings-toggle is-compact"
										checked={ this.isFieldTruthy( 'wp_mobile_excerpt' ) }
										disabled={ isFormPending }
										onChange={ this.handleToggle( 'wp_mobile_excerpt' ) }>
										<span>
											{ translate(
												'Use excerpts instead of full posts on front page and archive pages'
											) }
										</span>
									</FormToggle>

									<FormToggle
										className="theme-enhancements__module-settings-toggle is-compact"
										checked={ this.isFieldTruthy( 'wp_mobile_featured_images' ) }
										disabled={ isFormPending }
										onChange={ this.handleToggle( 'wp_mobile_featured_images' ) }>
										<span>
											{ translate(
												'Hide all featured images'
											) }
										</span>
									</FormToggle>

									<FormToggle
										className="theme-enhancements__module-settings-toggle is-compact"
										checked={ this.isFieldTruthy( 'wp_mobile_app_promos' ) }
										disabled={ isFormPending }
										onChange={ this.handleToggle( 'wp_mobile_app_promos' ) }>
										<span>
											{ translate(
												'Show an ad for the WordPress mobile apps in the footer of the mobile theme'
											) }
										</span>
									</FormToggle>
								</div>
							)
						}
					</FormFieldset>
				</Card>
			</div>
		);
	}
}

ThemeEnhancements.defaultProps = {
	submittingForm: false,
};

ThemeEnhancements.propTypes = {
	onSubmitForm: PropTypes.func.isRequired,
	fetchingSettings: PropTypes.bool.isRequired,
	submittingForm: PropTypes.bool,
};

export default connect(
	( state ) => {
		const selectedSiteId = getSelectedSiteId( state );
		const fetchingModules = isFetchingModules( state, selectedSiteId );
		const fetchingSettings = isRequestingJetpackSettings( state, selectedSiteId );
		const moduleSettings = pick( getJetpackSettings( state, selectedSiteId ), [
			'infinite_scroll',
			'infinite_scroll_google_analytics',
			'wp_mobile_excerpt',
			'wp_mobile_featured_images',
			'wp_mobile_app_promos'
		] );

		return {
			selectedSiteId,
			infiniteScrollModuleActive: !! isModuleActive( state, selectedSiteId, 'infinite-scroll' ),
			minilevenModuleActive: !! isModuleActive( state, selectedSiteId, 'minileven' ),
			moduleSettings,
			fetchingModuleData: !! ( fetchingModules || fetchingSettings ),
			updatingSettings: isUpdatingJetpackSettings( state, selectedSiteId ),
		};
	},
	{
		updateSettings
	}
)( protectForm( localize( ThemeEnhancements ) ) );
