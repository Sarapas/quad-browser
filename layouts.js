const util = require('electron-util');

let SINGLE = 'Single';
let QUAD = 'Quad';
let QUADH = 'QuadH';
let QUADV = 'QuadV';
let FIVEH = 'FiveH';
let FIVEV = 'FiveV';
let DUAL = 'Dual';
let TRI = 'Tri';
let SIXH = 'SixH';
let SIXV = 'SixV';
let NINE = 'Nine'

let aspect_ratio = 16 / 9;

const VIEW_COUNT = [];

function updateSingleLayout(parent, views) {
    views[0].setBounds(getUsableBounds(parent));
}
  
function updateDualLayout(parent, views) {
    let bounds = getUsableBounds(parent);
    let viewWidth = bounds.width
    let viewHeight = Math.floor(bounds.height / 2);

    let bounds1 = { x: bounds.x, y: bounds.y, width: viewWidth, height: viewHeight };
    let bounds2 = { x: bounds.x, y: bounds.y + viewHeight, width: viewWidth, height: viewHeight };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
}
  
function updateTriLayout(parent, views) {
    let bounds = getUsableBounds(parent);
    let topViewWidth = Math.floor(bounds.width / 2);
    let topViewHeight = Math.floor(topViewWidth / aspect_ratio);
    let bottomViewWidth = bounds.width;
    let bottomViewHeight = bounds.height - topViewHeight;

    let bounds1 = { x: bounds.x, y: bounds.y, width: topViewWidth, height: topViewHeight };
    let bounds2 = { x: bounds.x + topViewWidth, y: bounds.y, width: topViewWidth, height: topViewHeight };
    let bounds3 = { x: bounds.x, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
}
  
function updateQuadLayout(parent, views) {
    let size = calculateViewSize(parent, 2, 2);

    let bounds1 = { x: size.x, y: size.y, width: size.width, height: size.height };
    let bounds2 = { x: size.x + size.width, y: size.y, width: size.width, height: size.height };
    let bounds3 = { x: size.x, y: size.y + size.height, width: size.width, height: size.height };
    let bounds4 = { x: size.x + size.width, y: size.y + size.height, width: size.width, height: size.height };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
    views[3].setBounds(bounds4);
}
  
function updateQuadHorizontalLayout(parent, views) {
    let bounds = getUsableBounds(parent);

    let topViewWidth = Math.floor(bounds.width / 3);
    let topViewHeight = Math.floor(topViewWidth / aspect_ratio);

    let bottomViewWidth = bounds.width;
    let bottomViewHeight = bounds.height - topViewHeight;

    let bounds1 = { x: bounds.x, y: bounds.y, width: topViewWidth, height: topViewHeight };
    let bounds2 = { x: bounds.x + topViewWidth, y: bounds.y, width: topViewWidth, height: topViewHeight };
    let bounds3 = { x: bounds.x + topViewWidth * 2, y: bounds.y, width: topViewWidth, height: topViewHeight };
    let bounds4 = { x: bounds.x, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
    views[3].setBounds(bounds4);
}
  
function updateQuadVerticalLayout(parent, views) {
    let bounds = getUsableBounds(parent);

    let rightViewHeight = Math.floor(bounds.height / 3);
    let rightViewWidth = Math.floor(rightViewHeight * aspect_ratio);

    let leftViewWidth = bounds.width - rightViewWidth;
    let leftViewHeight = bounds.height;

    let bounds1 = { x: bounds.x, y: bounds.y, width: leftViewWidth, height: leftViewHeight };
    let bounds2 = { x: bounds.x + leftViewWidth, y: bounds.y, width: rightViewWidth, height: rightViewHeight };
    let bounds3 = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight, width: rightViewWidth, height: rightViewHeight };
    let bounds4 = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight * 2, width: rightViewWidth, height: rightViewHeight };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
    views[3].setBounds(bounds4);
}
  
function updateFiveHorizontalLayout(parent, views) {
    let bounds = getUsableBounds(parent);

    let topViewWidth = Math.floor(bounds.width / 3);
    let topViewHeight = Math.floor(topViewWidth / aspect_ratio);

    let bottomViewWidth = Math.floor(bounds.width / 2);
    let bottomViewHeight = Math.floor(bottomViewWidth / aspect_ratio);

    bounds.y = bounds.y + Math.floor((bounds.height - topViewHeight - bottomViewHeight) / 2);

    let bounds1 = { x: bounds.x, y: bounds.y, width: topViewWidth, height: topViewHeight };
    let bounds2 = { x: bounds.x + topViewWidth, y: bounds.y, width: topViewWidth, height: topViewHeight };
    let bounds3 = { x: bounds.x + topViewWidth * 2, y: bounds.y, width: topViewWidth, height: topViewHeight };
    let bounds4 = { x: bounds.x, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };
    let bounds5 = { x: bounds.x + bottomViewWidth, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
    views[3].setBounds(bounds4);
    views[4].setBounds(bounds5);
}
  
function updateFiveVerticalLayout(parent, views) {
    let bounds = getUsableBounds(parent);

    let rightViewHeight = Math.floor(bounds.height / 3);
    let rightViewWidth = Math.floor(rightViewHeight * aspect_ratio);

    let leftViewWidth = 0;
    let leftViewHeight = 0;

    let leftOffset = 0;

    if ((bounds.width - rightViewWidth) / (bounds.height / 2) < aspect_ratio) {
        leftViewWidth = bounds.width - rightViewWidth;
        leftViewHeight = Math.floor(leftViewWidth / aspect_ratio);
        leftOffset = Math.floor(bounds.height / 2) - leftViewHeight;
    } else {
        leftViewHeight = Math.floor(bounds.height / 2);
        leftViewWidth = Math.floor(leftViewHeight * aspect_ratio);
        bounds.x = bounds.x + Math.floor((bounds.width - leftViewWidth - rightViewWidth) / 2);
    }

    let bounds1 = { x: bounds.x, y: bounds.y + leftOffset, width: leftViewWidth, height: leftViewHeight };
    let bounds2 = { x: bounds.x, y: bounds.y + leftOffset + leftViewHeight, width: leftViewWidth, height: leftViewHeight };
    let bounds3 = { x: bounds.x + leftViewWidth, y: bounds.y, width: rightViewWidth, height: rightViewHeight };
    let bounds4 = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight, width: rightViewWidth, height: rightViewHeight };
    let bounds5 = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight * 2, width: rightViewWidth, height: rightViewHeight };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
    views[3].setBounds(bounds4);
    views[4].setBounds(bounds5);
}
  
function updateSixHorizontalLayout(parent, views) {
    let size = calculateViewSize(parent, 2, 3);

    let bounds1 = { x: size.x, y: size.y, width: size.width, height: size.height };
    let bounds2 = { x: size.x + size.width, y: size.y, width: size.width, height: size.height };
    let bounds3 = { x: size.x + size.width * 2, y: size.y, width: size.width, height: size.height };
    let bounds4 = { x: size.x, y: size.y + size.height, width: size.width, height: size.height };
    let bounds5 = { x: size.x + size.width, y: size.y + size.height, width: size.width, height: size.height };
    let bounds6 = { x: size.x + size.width * 2, y: size.y + size.height, width: size.width, height: size.height };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
    views[3].setBounds(bounds4);
    views[4].setBounds(bounds5);
    views[5].setBounds(bounds6);
}
  
function updateSixVerticalLayout(parent, views) {
    let size = calculateViewSize(parent, 3, 2);

    let bounds1 = { x: size.x, y: size.y, width: size.width, height: size.height };
    let bounds2 = { x: size.x + size.width, y: size.y, width: size.width, height: size.height };
    let bounds3 = { x: size.x, y: size.y + size.height, width: size.width, height: size.height };
    let bounds4 = { x: size.x + size.width, y: size.y + size.height, width: size.width, height: size.height };
    let bounds5 = { x: size.x, y: size.y + size.height * 2, width: size.width, height: size.height };
    let bounds6 = { x: size.x + size.width, y: size.y + size.height * 2, width: size.width, height: size.height };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
    views[3].setBounds(bounds4);
    views[4].setBounds(bounds5);
    views[5].setBounds(bounds6);
}

function updateNineLayout(parent, views) {
    let size = calculateViewSize(parent, 3, 3);

    let bounds1 = { x: size.x, y: size.y, width: size.width, height: size.height };
    let bounds2 = { x: size.x + size.width, y: size.y, width: size.width, height: size.height };
    let bounds3 = { x: size.x + size.width * 2, y: size.y, width: size.width, height: size.height };

    let bounds4 = { x: size.x, y: size.y + size.height, width: size.width, height: size.height };
    let bounds5 = { x: size.x + size.width, y: size.y + size.height, width: size.width, height: size.height };
    let bounds6 = { x: size.x + size.width * 2, y: size.y + size.height, width: size.width, height: size.height };

    let bounds7 = { x: size.x, y: size.y + size.height * 2, width: size.width, height: size.height };
    let bounds8 = { x: size.x + size.width, y: size.y + size.height * 2, width: size.width, height: size.height };
    let bounds9 = { x: size.x + size.width * 2, y: size.y + size.height * 2, width: size.width, height: size.height };

    views[0].setBounds(bounds1);
    views[1].setBounds(bounds2);
    views[2].setBounds(bounds3);
    views[3].setBounds(bounds4);
    views[4].setBounds(bounds5);
    views[5].setBounds(bounds6);
    views[6].setBounds(bounds7);
    views[7].setBounds(bounds8);
    views[8].setBounds(bounds9);
}
  
function calculateViewSize(parent, rows, cols) {
    let bounds = getUsableBounds(parent);
    let ratio = aspect_ratio * cols / rows;
    let viewWidth = 0;
    let viewHeight = 0;
    let x = bounds.x;
    let y = bounds.y;

    if (bounds.width / bounds.height < ratio) {
        let newHeight = bounds.width / ratio;
        const barHeight = Math.floor((bounds.height - newHeight) / 2);
        y += barHeight;
        viewWidth = Math.floor(bounds.width / cols);
        viewHeight = Math.floor(newHeight / rows);
    } else {
        let newWidth = bounds.height * ratio;
        const barWidth = Math.floor((bounds.width - newWidth) / 2);
        x += barWidth;
        viewWidth = Math.floor(newWidth / cols);
        viewHeight = Math.floor(bounds.height / rows);
    }

    return { x: x, y: y, width: viewWidth, height: viewHeight };
}

function getUsableBounds(parent) {
    let parentX = parent.getPosition()[0];
    let parentY = parent.getPosition()[1];
    let contentBounds = parent.getContentBounds();
    let offsetX = parentX;
    let offsetY = parentY + (util.is.macos && !parent.isFullScreen() ? util.menuBarHeight() : 0);
    return { x: offsetX, y: offsetY, width: contentBounds.width, height: contentBounds.height };
}

function updateLayout(layout, parent, views) {
    if (layout === SINGLE) updateSingleLayout(parent, views);
    if (layout === DUAL) updateDualLayout(parent, views);
    if (layout === TRI) updateTriLayout(parent, views);
    if (layout === QUAD) updateQuadLayout(parent, views);
    if (layout === QUADH) updateQuadHorizontalLayout(parent, views);
    if (layout === QUADV) updateQuadVerticalLayout(parent, views);
    if (layout === FIVEH) updateFiveHorizontalLayout(parent, views);
    if (layout === FIVEV) updateFiveVerticalLayout(parent, views);
    if (layout === SIXH) updateSixHorizontalLayout(parent, views);
    if (layout === SIXV) updateSixVerticalLayout(parent, views);
    if (layout === NINE) updateNineLayout(parent, views);
}

function getViewNames(layout) {
    if (layout === SINGLE)
        return [ { name: "Current", number: null } ];
      
    if (layout === DUAL)
        return [ 
            { name: "Top", number: 1 },
            { name: "Bottom", number: 2 },
            { name: "All", number: null }
        ];
  
    if (layout === TRI)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top right", number: 2 },
            { name: "Bottom", number: 3 },
            { name: "All", number: null }
        ];
  
    if (layout === QUAD)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top right", number: 2 },
            { name: "Bottom left", number: 3 },
            { name: "Bottom right", number: 4 },
            { name: "All", number: null }
        ];
  
    if (layout === QUADH)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top center", number: 2 },
            { name: "Top right", number: 3 },
            { name: "Bottom", number: 4 },
            { name: "All", number: null }
        ];
  
    if (layout === QUADV)
        return [ 
            { name: "Left", number: 1 },
            { name: "Top right", number: 2 },
            { name: "Middle right", number: 3 },
            { name: "Bottom right", number: 4 },
            { name: "All", number: null }
        ];
  
    if (layout === FIVEH)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top center", number: 2 },
            { name: "Top right", number: 3 },
            { name: "Bottom left", number: 4 },
            { name: "Bottom right", number: 5 },
            { name: "All", number: null }
        ];
  
    if (layout === FIVEV)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Bottom left", number: 2 },
            { name: "Top right", number: 3 },
            { name: "Middle right", number: 4 },
            { name: "Bottom right", number: 5 },
            { name: "All", number: null }
        ];
  
    if (layout === SIXH)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top center", number: 2 },
            { name: "Top right", number: 3 },
            { name: "Bottom left", number: 4 },
            { name: "Bottom center", number: 5 },
            { name: "Bottom right", number: 6 },
            { name: "All", number: null }
        ];
  
    if (layout === SIXV)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top right", number: 2 },
            { name: "Middle left", number: 3 },
            { name: "Middle right", number: 4 },
            { name: "Bottom left", number: 5 },
            { name: "Bottom right", number: 6 },
            { name: "All", number: null }
        ];

    if (layout === NINE)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top center", number: 2 },
            { name: "Top right", number: 3 },
            { name: "Middle left", number: 4 },
            { name: "Middle center", number: 5 },
            { name: "Middle right", number: 6 },
            { name: "Bottom left", number: 7 },
            { name: "Bottom center", number: 8 },
            { name: "Bottom right", number: 9 },
            { name: "All", number: null }
        ];

    throw new Error('Unknown layout: ' + layout);
}

function getViewCount(layout) {
    if (VIEW_COUNT.length === 0) {
        VIEW_COUNT[SINGLE] = 1;
        VIEW_COUNT[DUAL] = 2;
        VIEW_COUNT[TRI] = 3;
        VIEW_COUNT[QUAD] = 4;
        VIEW_COUNT[QUADH] = 4;
        VIEW_COUNT[QUADV] = 4;
        VIEW_COUNT[FIVEH] = 5;
        VIEW_COUNT[FIVEV] = 5;
        VIEW_COUNT[SIXH] = 6;
        VIEW_COUNT[SIXV] = 6;
        VIEW_COUNT[NINE] = 9;
    }
    
    return VIEW_COUNT[layout];
}

var exports = (module.exports = {
    updateLayout: updateLayout,
    getViewNames: getViewNames,
    getViewCount: getViewCount,
    SINGLE : SINGLE,
    DUAL: DUAL,
    TRI: TRI,
    QUAD: QUAD,
    QUADH: QUADH,
    QUADV: QUADV,
    FIVEH: FIVEH,
    FIVEV: FIVEV,
    SIXH: SIXH,
    SIXV: SIXV,
    NINE: NINE
});