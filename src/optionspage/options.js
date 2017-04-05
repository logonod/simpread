console.log( "==== simpread options page load ====" )

import '../assets/css/options_page.css';
import '../assets/css/option.css';
import '../vender/notify/notify.css';

import Velocity   from 'velocity';
import Notify     from 'notify';

import Tabs       from 'tabs';
import * as waves from 'waves';
import * as tt    from 'tooltip';
import Button     from 'button';
import * as side  from 'sidebar';

import { storage, STORAGE_MODE as mode } from 'storage';
import * as ss    from 'stylesheet';

import FocusOpt   from 'focusopt';
import ReadOpt    from 'readopt';
import CommonOpt  from 'commonopt';

let tabsItemID = 0;

const tabsItem = [{
        name: "共通",
        value: "common",
        active : true,
        route: "#common",
    },{
        name: "聚焦模式",
        value: "focus",
        route: "#focus",
    },{
        name: "阅读模式",
        value: "read",
        route: "#read",
    },{
        name: "稍后读",
        value: "later",
        route: "#later",
    },{
        name: "关于",
        value: "about",
        route: "#about",
}],
    headerColors  = [ "#64B5F6", "#81C784", "#9575CD", "#BA68C8", "#4DB6AC" ],
    topColors     = [ "#2196F3", "#4CAF50", "#673AB7", "#9C27B0", "#009688" ],
    menuItem      = tabsItem.map( ( item, idx ) => {
       const menu = { ...item };
       switch ( idx ) {
            case 0:
                delete menu.active;
                menu.icon = ss.IconPath( "common_icon" );
                break;
            case 1:
                menu.icon = ss.IconPath( "focus_mode_icon" );
                break;
            case 2:
                menu.icon = ss.IconPath( "read_mode_icon" );
                break;
            case 3:
                menu.icon = ss.IconPath( "read_later_icon" );
                break;
            case 4:
                menu.icon = ss.IconPath( "about_icon" );
                break;
       }
       return menu;
});

/**
 * Add parallax scroll
 */
$( window ).scroll( (event) => {
    const $target = $( event.target ),
          scroll  = $target.scrollTop(),
          offset  = ( 0 - scroll ) / 2;
    scroll >  200 && ( $( ".header" ).css({ opacity: 1, visibility: "visible" }) );
    scroll <= 200 && ( $( ".header" ).css({ opacity: 0, visibility: "hidden"  }) );
    $( ".top" ).css( "transform", `translate3d(0px, ${offset}px, 0px)` );
});

/**
 * Get tabsItemID from window.location.hash exist
 */
window.location.hash && ( tabsItemID = tabsItem.findIndex( item => item.route == window.location.hash ) );
tabsItemID == -1 || tabsItemID == 0 ? tabsItemID = 0 : tabsItem.forEach( ( item, index ) => item.active = tabsItemID == index ? true : false );

/**
 * Entry:
 * - get data from chrome storage
 * - waves.Render()
 * - tooltip.Render()
 */
storage.Get( first => {
    console.log( "simpread storage get success!", storage.focus, storage.read, first );
    firstLoad( first );
    sidebarRender();
    navRender();
    mainRender( tabsItemID );
    tt.Render( "body" );
    waves.Render({ root: "simpread-font", name: "sr-tabs" });
});

/**
 * First load call remote simpread data structure( usage storage.Sync() )
 * 
 * @param {bool} is first load
 */
function firstLoad( first ) {
    first && storage.GetNewsites( "local", ( _, error ) => {
        error && new Notify().Render( 0, "本地更新出现错误，请选择手动点击 同步配置列表" );
    });
    window.location.hash && window.location.hash == "#firstload" && first &&
        storage.Sync( "get", success => {
            success && ReactDOM.unmountComponentAtNode( $( ".tabscontainer" )[0] );
            success && new Notify().Render( 0, "数据恢复成功！" );
            success && mainRender( tabsItemID );
    });
}

/**
 * Set options page style and tabs.Render()
 *
 * @param {number} headerColors index
 */
function mainRender( idx ) {
    $( ".top" ).css( "background-color", topColors[idx] );
    $( ".header" ).css( "background-color", topColors[idx] ).find( ".title" ).text( tabsItem[idx].name );
    tabsRender( headerColors[ idx ] );
}

/**
 * Tabs render
 * 
 * @param {string} header background color
 */
function tabsRender( color ) {
    const tabs = <Tabs waves="sr-tabs waves-effect waves-light"
                    headerStyle={{ transition: 'all 1000ms cubic-bezier(0.23, 1, 0.32, 1) 0ms' }}
                    bgColor={ color }
                    items={ tabsItem }
                    onChange={ ( $p, evt )=>tabsOnChange( $p, evt ) }>
                    <section>
                        <CommonOpt backgroundColor={ topColors[0] } sync={ ()=> refresh() } />
                    </section>
                    <section>
                        <FocusOpt option={ storage.focus } />
                        <Button type="raised" width="100%" text="保 存"
                                color="#fff" backgroundColor={ topColors[1] }
                                icon={ ss.IconPath( "save_icon" ) }
                                waves="sr-button waves-effect waves-button" 
                                onClick={ ()=>save( mode.focus ) } />
                    </section>
                    <section>
                        <ReadOpt option={ storage.read } />
                        <Button type="raised" width="100%" text="保 存"
                                color="#fff" backgroundColor={ topColors[2] }
                                icon={ ss.IconPath( "save_icon" ) }
                                waves="sr-button waves-effect waves-button" 
                                onClick={ ()=>save( mode.read ) } />
                    </section>
                    <section>Later</section>
                    <section>About</section>
                </Tabs>,
          tabsOnChange = ( $prev, event ) => {
                let $target = $( event.target );
                while ( !$target.is( "tab-label" ) ) { $target = $target.parent(); }
                const idx = $target.find( "a" ).attr( "id" );
                mainRender( idx );
                tabsItem.forEach( ( item, index ) => item.active = idx == index ? true : false );
          },
          refresh = () => {
                tt.Render( "body" );
          },
          save = mode => {
                storage.Write( ()=> {
                    new Notify().Render( 0, "保存成功，页面刷新后生效！" );
                });
          };
    ReactDOM.render( tabs, $( ".tabscontainer" )[0] );
}

/**
 * navigation Render
 */
function navRender() {
    const navClick = () => {
        side.Open();
    };
    const button = <Button waves="sr-tabs waves-effect waves-circle" hoverColor="transparent" icon={ ss.IconPath( "sidebar_icon" ) } onClick={ ()=>navClick() } />;
    ReactDOM.render( button, $( ".header .nav" )[0] );
}

/**
 * sidebar Render
 */
function sidebarRender() {
    const sidebarClick = ( $target, items ) => {
        const idx = tabsItem.findIndex( item => item.value == items.value );
        tabsItem.forEach( ( item, index ) => item.active = idx == index ? true : false );
        mainRender( idx );
    };
    const sidebar = <side.Sidebar items={ menuItem }
                             waves="sr-tabs waves-effect waves-button" 
                             header="设定" footer=" 简悦 © 2017" onClick={ ($t,o)=>sidebarClick($t,o) } />;
    ReactDOM.render( sidebar, $( ".sidebar" )[0] );
}
