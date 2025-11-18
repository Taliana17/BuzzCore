'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">buzz-core documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-d6f123356ae38636415ca65d02eeacbfd7dd1e4a78c5591b7270de6c018d2033c6c81a3378cc6705c3b4a0590e4d7debe8847245b6ba283332dd6e2312449fe8"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-d6f123356ae38636415ca65d02eeacbfd7dd1e4a78c5591b7270de6c018d2033c6c81a3378cc6705c3b4a0590e4d7debe8847245b6ba283332dd6e2312449fe8"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-d6f123356ae38636415ca65d02eeacbfd7dd1e4a78c5591b7270de6c018d2033c6c81a3378cc6705c3b4a0590e4d7debe8847245b6ba283332dd6e2312449fe8"' :
                                            'id="xs-controllers-links-module-AuthModule-d6f123356ae38636415ca65d02eeacbfd7dd1e4a78c5591b7270de6c018d2033c6c81a3378cc6705c3b4a0590e4d7debe8847245b6ba283332dd6e2312449fe8"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-d6f123356ae38636415ca65d02eeacbfd7dd1e4a78c5591b7270de6c018d2033c6c81a3378cc6705c3b4a0590e4d7debe8847245b6ba283332dd6e2312449fe8"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-d6f123356ae38636415ca65d02eeacbfd7dd1e4a78c5591b7270de6c018d2033c6c81a3378cc6705c3b4a0590e4d7debe8847245b6ba283332dd6e2312449fe8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-d6f123356ae38636415ca65d02eeacbfd7dd1e4a78c5591b7270de6c018d2033c6c81a3378cc6705c3b4a0590e4d7debe8847245b6ba283332dd6e2312449fe8"' :
                                        'id="xs-injectables-links-module-AuthModule-d6f123356ae38636415ca65d02eeacbfd7dd1e4a78c5591b7270de6c018d2033c6c81a3378cc6705c3b4a0590e4d7debe8847245b6ba283332dd6e2312449fe8"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LocationHistoryModule.html" data-type="entity-link" >LocationHistoryModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-LocationHistoryModule-618e090b8d3aca0ae34a024cdd00ea30cfad273eacacfdbab58f0c37b1006f45b6623bd2842149272da5d691bb274efe76453663d8e975ff298298e3b67c8799"' : 'data-bs-target="#xs-controllers-links-module-LocationHistoryModule-618e090b8d3aca0ae34a024cdd00ea30cfad273eacacfdbab58f0c37b1006f45b6623bd2842149272da5d691bb274efe76453663d8e975ff298298e3b67c8799"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-LocationHistoryModule-618e090b8d3aca0ae34a024cdd00ea30cfad273eacacfdbab58f0c37b1006f45b6623bd2842149272da5d691bb274efe76453663d8e975ff298298e3b67c8799"' :
                                            'id="xs-controllers-links-module-LocationHistoryModule-618e090b8d3aca0ae34a024cdd00ea30cfad273eacacfdbab58f0c37b1006f45b6623bd2842149272da5d691bb274efe76453663d8e975ff298298e3b67c8799"' }>
                                            <li class="link">
                                                <a href="controllers/LocationHistoryController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LocationHistoryController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LocationHistoryModule-618e090b8d3aca0ae34a024cdd00ea30cfad273eacacfdbab58f0c37b1006f45b6623bd2842149272da5d691bb274efe76453663d8e975ff298298e3b67c8799"' : 'data-bs-target="#xs-injectables-links-module-LocationHistoryModule-618e090b8d3aca0ae34a024cdd00ea30cfad273eacacfdbab58f0c37b1006f45b6623bd2842149272da5d691bb274efe76453663d8e975ff298298e3b67c8799"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LocationHistoryModule-618e090b8d3aca0ae34a024cdd00ea30cfad273eacacfdbab58f0c37b1006f45b6623bd2842149272da5d691bb274efe76453663d8e975ff298298e3b67c8799"' :
                                        'id="xs-injectables-links-module-LocationHistoryModule-618e090b8d3aca0ae34a024cdd00ea30cfad273eacacfdbab58f0c37b1006f45b6623bd2842149272da5d691bb274efe76453663d8e975ff298298e3b67c8799"' }>
                                        <li class="link">
                                            <a href="injectables/LocationHistoryService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LocationHistoryService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/NotificationModule.html" data-type="entity-link" >NotificationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-NotificationModule-b4e5c79f7b4d00601bfe9fdd0209ca5dafeca05c377f0f219c0962a81ab4be8a148730a15a0ba0f733515dae8ad4f7a8a406d828d675844b6005be0bc14e0321"' : 'data-bs-target="#xs-injectables-links-module-NotificationModule-b4e5c79f7b4d00601bfe9fdd0209ca5dafeca05c377f0f219c0962a81ab4be8a148730a15a0ba0f733515dae8ad4f7a8a406d828d675844b6005be0bc14e0321"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NotificationModule-b4e5c79f7b4d00601bfe9fdd0209ca5dafeca05c377f0f219c0962a81ab4be8a148730a15a0ba0f733515dae8ad4f7a8a406d828d675844b6005be0bc14e0321"' :
                                        'id="xs-injectables-links-module-NotificationModule-b4e5c79f7b4d00601bfe9fdd0209ca5dafeca05c377f0f219c0962a81ab4be8a148730a15a0ba0f733515dae8ad4f7a8a406d828d675844b6005be0bc14e0321"' }>
                                        <li class="link">
                                            <a href="injectables/EmailProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GeocodingService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GeocodingService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GooglePlacesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GooglePlacesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NotificationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SmsProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SmsProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TouristPlacesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TouristPlacesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TemplatePlaygroundModule.html" data-type="entity-link" >TemplatePlaygroundModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                            'id="xs-components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                            <li class="link">
                                                <a href="components/TemplatePlaygroundComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplatePlaygroundComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                        'id="xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <li class="link">
                                            <a href="injectables/HbsRenderService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HbsRenderService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TemplateEditorService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplateEditorService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ZipExportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ZipExportService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserModule.html" data-type="entity-link" >UserModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UserModule-3ad53536678a89ee0e7d43dff19fc69b271afd420c8d813316da3922adca593d79ad2496c7f6b70329ebb0d9b83ae01b08a35eb3992b8c4e3e572a7bcceaa0da"' : 'data-bs-target="#xs-controllers-links-module-UserModule-3ad53536678a89ee0e7d43dff19fc69b271afd420c8d813316da3922adca593d79ad2496c7f6b70329ebb0d9b83ae01b08a35eb3992b8c4e3e572a7bcceaa0da"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UserModule-3ad53536678a89ee0e7d43dff19fc69b271afd420c8d813316da3922adca593d79ad2496c7f6b70329ebb0d9b83ae01b08a35eb3992b8c4e3e572a7bcceaa0da"' :
                                            'id="xs-controllers-links-module-UserModule-3ad53536678a89ee0e7d43dff19fc69b271afd420c8d813316da3922adca593d79ad2496c7f6b70329ebb0d9b83ae01b08a35eb3992b8c4e3e572a7bcceaa0da"' }>
                                            <li class="link">
                                                <a href="controllers/UserController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserModule-3ad53536678a89ee0e7d43dff19fc69b271afd420c8d813316da3922adca593d79ad2496c7f6b70329ebb0d9b83ae01b08a35eb3992b8c4e3e572a7bcceaa0da"' : 'data-bs-target="#xs-injectables-links-module-UserModule-3ad53536678a89ee0e7d43dff19fc69b271afd420c8d813316da3922adca593d79ad2496c7f6b70329ebb0d9b83ae01b08a35eb3992b8c4e3e572a7bcceaa0da"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserModule-3ad53536678a89ee0e7d43dff19fc69b271afd420c8d813316da3922adca593d79ad2496c7f6b70329ebb0d9b83ae01b08a35eb3992b8c4e3e572a7bcceaa0da"' :
                                        'id="xs-injectables-links-module-UserModule-3ad53536678a89ee0e7d43dff19fc69b271afd420c8d813316da3922adca593d79ad2496c7f6b70329ebb0d9b83ae01b08a35eb3992b8c4e3e572a7bcceaa0da"' }>
                                        <li class="link">
                                            <a href="injectables/UserService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#controllers-links"' :
                                'data-bs-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/AppController.html" data-type="entity-link" >AppController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/AuthController.html" data-type="entity-link" >AuthController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/LocationHistoryController.html" data-type="entity-link" >LocationHistoryController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/NotificationController.html" data-type="entity-link" >NotificationController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UserController.html" data-type="entity-link" >UserController</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#entities-links"' :
                                'data-bs-target="#xs-entities-links"' }>
                                <span class="icon ion-ios-apps"></span>
                                <span>Entities</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="entities-links"' : 'id="xs-entities-links"' }>
                                <li class="link">
                                    <a href="entities/LocationHistory.html" data-type="entity-link" >LocationHistory</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Notification.html" data-type="entity-link" >Notification</a>
                                </li>
                                <li class="link">
                                    <a href="entities/User.html" data-type="entity-link" >User</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/CreateLocationHistoryDto.html" data-type="entity-link" >CreateLocationHistoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateNotificationDto.html" data-type="entity-link" >CreateNotificationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserDto.html" data-type="entity-link" >CreateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReceiveLocationDto.html" data-type="entity-link" >ReceiveLocationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterDto.html" data-type="entity-link" >RegisterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserDto.html" data-type="entity-link" >UpdateUserDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AppService.html" data-type="entity-link" >AppService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EmailProcessor.html" data-type="entity-link" >EmailProcessor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EmailProvider.html" data-type="entity-link" >EmailProvider</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GeocodingService.html" data-type="entity-link" >GeocodingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GooglePlacesService.html" data-type="entity-link" >GooglePlacesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HbsRenderService.html" data-type="entity-link" >HbsRenderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtAuthGuard.html" data-type="entity-link" >JwtAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtStrategy.html" data-type="entity-link" >JwtStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocationHistoryService.html" data-type="entity-link" >LocationHistoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationQueueService.html" data-type="entity-link" >NotificationQueueService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationService.html" data-type="entity-link" >NotificationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationService-1.html" data-type="entity-link" >NotificationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SmsProcessor.html" data-type="entity-link" >SmsProcessor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SmsProvider.html" data-type="entity-link" >SmsProvider</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemplateEditorService.html" data-type="entity-link" >TemplateEditorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TouristPlacesService.html" data-type="entity-link" >TouristPlacesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ZipExportService.html" data-type="entity-link" >ZipExportService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/RolesGuard.html" data-type="entity-link" >RolesGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/CompoDocConfig.html" data-type="entity-link" >CompoDocConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EmailResult.html" data-type="entity-link" >EmailResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EmailResult-1.html" data-type="entity-link" >EmailResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GooglePlacesResponse.html" data-type="entity-link" >GooglePlacesResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtPayload.html" data-type="entity-link" >JwtPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificationMetadata.html" data-type="entity-link" >NotificationMetadata</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificationStats.html" data-type="entity-link" >NotificationStats</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlaceResult.html" data-type="entity-link" >PlaceResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlaceResult-1.html" data-type="entity-link" >PlaceResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ServiceStatusResponse.html" data-type="entity-link" >ServiceStatusResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Session.html" data-type="entity-link" >Session</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SmsResult.html" data-type="entity-link" >SmsResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SmsResult-1.html" data-type="entity-link" >SmsResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Template.html" data-type="entity-link" >Template</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestPlaceDetailsResponse.html" data-type="entity-link" >TestPlaceDetailsResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestPlacesResponse.html" data-type="entity-link" >TestPlacesResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TravelTime.html" data-type="entity-link" >TravelTime</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TravelTimeResponse.html" data-type="entity-link" >TravelTimeResponse</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});