import * as React from "react";
import * as Constants from "~/common/constants";
import * as Strings from "~/common/strings";
import * as Actions from "~/common/actions";
import * as SVG from "~/common/svg";
import * as Window from "~/common/window";

import { css } from "@emotion/react";
import { LoaderSpinner } from "~/components/system/components/Loaders";
import { ProcessedText } from "~/components/system/components/Typography";

import TextareaAutoSize from "~/vendor/react-textarea-autosize";
import GlobalViewerCIDSidebarSlates from "~/components/core/viewers/GlobalViewerCIDSidebarSlates";

const STYLES_SIDEBAR = css`
  width: 420px;
  padding-left: 24px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: ${Constants.sizes.mobile}px) {
    display: none;
  }
`;

const STYLES_BUTTON = css`
  font-family: ${Constants.font.semiBold};
  color: ${Constants.system.pitchBlack};
  flex-shrink: 0;
  width: 100%;
  padding: 16px 24px 16px 24px;
  min-height: 56px;
  font-size: 14px;
  transition: 200ms ease all;
  cursor: pointer;
  overflow-wrap: break-word;
  text-decoration: none;
  text-align: right;

  :hover {
    color: ${Constants.system.blue};
  }
`;

const STYLES_SIDEBAR_SECTION = css`
  flex-shrink: 0;
  width: 100%;
`;

const STYLES_SIDEBAR_CONTENT = css`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: -ms-autohiding-scrollbar;

  ::-webkit-scrollbar {
    display: none;
  }
`;

const STYLES_HEADING = css`
  font-family: ${Constants.font.medium};
  font-size: 16px;
  line-height: 1.225;
  font-weight: 400;
  padding: 16px 24px 24px 24px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
`;

const STYLES_BODY = css`
  font-size: 16px;
  line-height: 1.225;
  padding: 24px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
`;

export default class GlobalViewerCIDSidebar extends React.Component {
  _handleDownload = () => {
    // NOTE(jim): 2mb limit on this.
    const extension = Strings.getFileExtension(this.props.data.file);
    const download = `${this.props.cid}.${extension}`;
    const uri = Strings.getCIDGatewayURL(this.props.cid);

    Window.saveAs(uri, download);
  };

  render() {
    const elements = [];

    if (this.props.onClose) {
      elements.push(
        <span
          key="s-1"
          css={STYLES_BUTTON}
          style={{ textAlign: "right" }}
          onMouseUp={this.props.onClose}
          onTouchEnd={this.props.onClose}
        >
          <SVG.Dismiss height="20px" />
        </span>
      );
    }

    if (this.props.renderDataControls) {
      elements.push(
        <GlobalViewerCIDSidebarSlates
          key="s-2"
          data={this.props.data}
          slates={this.props.slates}
          loading={this.props.loading}
          onAddToSlate={this.props.onAddToSlate}
          onRemoveFromSlate={this.props.onRemoveFromSlate}
        />
      );
    }

    if (this.props.onDataDelete) {
      elements.push(
        <span
          key="s-4"
          css={STYLES_BUTTON}
          onMouseUp={this.props.onDataDelete}
          onTouchEnd={this.props.onDataDelete}
        >
          {this.props.loading ? (
            <LoaderSpinner style={{ height: 16, width: 16 }} />
          ) : (
            <span>Delete CID and from all slates &nbsp;&nbsp;⭢</span>
          )}
        </span>
      );
    }

    if (!elements.length) {
      return null;
    }

    return <div css={STYLES_SIDEBAR}>{elements}</div>;
  }
}
