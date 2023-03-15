var React = require('react');
import { IconButton, FlatButton } from 'material-ui';
var UserStore = require('stores/UserStore');
var toastr = require('toastr');
// import gapi from 'gapi-client';

export default class FlashCard extends React.Component {
  static defaultProps = {
    data_source: null, // For Google Sheet, unique Spreadsheet Id from URL
    data_source_type: 'gsheet',
    worksheet: null,
    widget_name: "Flash Card",
    layout: 'card',
    colstart: 'A',  // First column with data
    colend: 'D', // Last column with data
    title: 'title', // Header on spreadsheet that contains title
    link: 'link', // Header on spreadsheet that contains link (optional)
    subhead: 'subhead', // Header on spreadsheet that contains subhead
    details: 'details', // Header on spreadsheet that contains details
    withhold: [] // FlashCard functionality, which props to hide before user click (e.g. ['subhead'])
  }

  constructor(props) {
      super(props);
      this.state = {
        title: null,
        subhead: null,
        link: null,
        details: null,
        all_data: null,
        flipped: false
      };
      this.GSHEET_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
  }

  componentDidMount() {
    this.refresh();
  }

  handle_error(fail) {
    console.warn(fail);
    toastr.error('An error occurred: ' + fail);
  }

  flipping_enabled() {
    return this.props.withhold.length > 0;
  }

  goto_source() {
    let url = "https://docs.google.com/spreadsheets/d/"+this.props.data_source+"/edit";
    window.open(url, "_blank");
  }

  maybe_load_client(cb) {
    console.log('maybe_load_client');
    if (!gapi.client) gapi.load('client', cb);
    else cb();
  }

  maybe_request_scopes(cb) {
    UserStore.request_scopes([this.GSHEET_SCOPE], cb, this.handle_error.bind(this));
  }

  maybe_init_client(cb) {
    console.log('maybe_init_client...');
    gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4')
    .then(function() {
      cb();
    }).then((res) => {
      console.log(res);
    })
  }

  request_spreadsheet_data() {
    let {data_source, colstart, colend, worksheet} = this.props;
    console.log('request_spreadsheet_data');
    let range = `${colstart}:${colend}`;
    if (worksheet != null) range = worksheet + '!' + range;
    return gapi.client.request({
      path: `https://sheets.googleapis.com/v4/spreadsheets/${data_source}/values/${range}?majorDimension=COLUMNS`
    })
  }

  have_data() {
    return this.state.all_data != null;
  }

  save_data(data) {
    this.setState({all_data: data}, () => {
      this.get_random_row();
    })
  }

  get_random_row() {
    let {all_data} = this.state;
    let rows = all_data.values[0].length - 1;
    let row = parseInt(Math.random() * rows) + 1;
    let st = {};
    all_data.values.forEach((col) => {
      let header = col[0];
      if (this.props.title && header.toLowerCase() == this.props.title.toLowerCase()) st.title = col[row];
      if (this.props.subhead && header.toLowerCase() == this.props.subhead.toLowerCase()) st.subhead = col[row];
      if (this.props.link && header.toLowerCase() == this.props.link.toLowerCase()) st.link = col[row];
      if (this.props.details && header.toLowerCase() == this.props.details.toLowerCase()) st.details = col[row];
    });
    st.flipped = false;
    this.setState(st);
  }

  refresh() {
    if (this.have_data()) this.get_random_row();
    else {
      let {data_source, colstart, colend} = this.props;
      this.maybe_load_client(() => {
        this.maybe_request_scopes(() => {
          this.maybe_init_client(() => {
            this.request_spreadsheet_data().then((response) => {
              var range = response.result;
              this.save_data(range);
            }, (fail_response) => {
              console.warn(fail_response);
            });
          })
        })
      });

    }
  }

  hide_section(section) {
    let {flipped} = this.state;
    let {withhold} = this.props;
    return !flipped && withhold.indexOf(section) > -1;
  }

  flip() {
    let {flipped} = this.state;
    this.setState({flipped: !flipped})
  }

  render() {
    let {title, subhead, link, details} = this.state;
    let {layout, col_order} = this.props;
    let cls = "FlashCard " + layout;
    let _content, _flipping;
    if (this.have_data()) {
      if (layout == 'card') {
        let _link;
        if (link) _link = <span>(<a href={link} target="_blank">link</a>)</span>
        _content = (
          <div>
            <span hidden={this.hide_section('title')}><h2>{title}</h2></span>
            <span hidden={this.hide_section('subhead')}><h4>{subhead} { _link }</h4></span>
            <span hidden={this.hide_section('details')}><p>{details}</p></span>
          </div>
        )
      } else if (layout == 'bold') {
        _content = (
          <div>
            <span hidden={this.hide_section('title')}><h1>{title}</h1></span>
            <span hidden={this.hide_section('subhead')}><h4>{subhead}</h4></span>
          </div>
        )
      }
      if (this.flipping_enabled()) {
        let {flipped} = this.state;
        _flipping = (
          <FlatButton label={flipped ? "Hide" : "Show"} onClick={this.flip.bind(this)} />
        )
      }
    }
    return (
      <div className={cls}>
        <h3>{ this.props.widget_name }</h3>
        {_content}

        <div className="vpad">
          {_flipping}
          <IconButton iconClassName="material-icons" onClick={this.refresh.bind(this)}>refresh</IconButton>
        </div>
        <div hidden={!this.have_data()}>
          <small><a href="#" onClick={this.goto_source.bind(this)}>Go to source sheet</a></small>
        </div>
      </div>
    );
  }
}
