const util = require('electron-util');

let SINGLE = 'Single';
let QUAD = 'Quad';
let QUADH = 'QuadH';
let QUADV = 'QuadV';
let FIVEH = 'FiveH';
let H4n1 = 'H4n1';
let FIVEV = 'FiveV';
let V1n4 = 'V1n4';
let DUAL = 'Dual';
let SIDES = 'Sides';
let TRI = 'Tri';
let H6 = 'SixH';
let V6 = 'SixV';
let H8 = 'H8';
let V8 = 'V8';
let NINE = 'Nine'

let aspect_ratio = 16 / 9;

const VIEW_COUNT = [];

function updateSingleLayout(parent, views) {
    setRectangleLayout(parent, views, 1, 1);
}
  
function updateDualLayout(parent, views) {
    setRectangleLayout(parent, views, 1, 2);
}

function updateSidesLayout(parent, views) {
    setRectangleLayout(parent, views, 2, 1);
}
  
function updateTriLayout(parent, views) {
    setNPlusMHorizontalLayout(parent, views, 2, 1);
}
  
function updateQuadLayout(parent, views) {
    setRectangleLayout(parent, views, 2, 2);
}
  
function updateQuadHorizontalLayout(parent, views) {
    setNPlusMHorizontalLayout(parent, views, 3, 1);
}
  
function updateQuadVerticalLayout(parent, views) {
    set1PlusMVerticalLayout(parent, views, 3);
}
  
function updateFiveHorizontalLayout(parent, views) {
    setNPlusMHorizontalLayout(parent, views, 3, 2);
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
  
function updateH4n1Layout(parent, views) {
    setNPlusMHorizontalLayout(parent, views, 4, 1);
}

function updateV1n4Layout(parent, views) {
    set1PlusMVerticalLayout(parent, views, 4);
}

function updateSixHorizontalLayout(parent, views) {
    setRectangleLayout(parent, views, 3, 2);
}
  
function updateSixVerticalLayout(parent, views) {
    setRectangleLayout(parent, views, 2, 3);
}

function updateH8Layout(parent, views) {
    setRectangleLayout(parent, views, 4, 2);
}

function updateV8Layout(parent, views) {
    setRectangleLayout(parent, views, 2, 4);
}

function updateNineLayout(parent, views) {
    setRectangleLayout(parent, views, 3, 3);
}

function set1PlusMVerticalLayout(parent, views, m) {
    // LIMITATIONS
    // * Assumes 2 cols
    // * Assumes right col has more views than left row
    // * Works with 1 on the left

    let bounds = getUsableBounds(parent);

    let rightViewHeight = Math.floor(bounds.height / m);
    let rightViewWidth = Math.floor(rightViewHeight * aspect_ratio);

    let leftViewWidth = bounds.width - rightViewWidth;
    let leftViewHeight = bounds.height;

    let leftBounds = { x: bounds.x, y: bounds.y, width: leftViewWidth, height: leftViewHeight };
    views[0].setBounds(leftBounds);

    for (var i = 0; i < m; i++) {
        let rightBounds = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight * i, width: rightViewWidth, height: rightViewHeight };
        views[i + 1].setBounds(rightBounds);
    }
}

function setNPlusMHorizontalLayout(parent, views, n, m) {
    // LIMITATIONS
    // * Assumes 2 rows
    // * Assumes top row has more views than bottom row
    // * Works with enough height

    let bounds = getUsableBounds(parent);

    let topViewWidth = Math.floor(bounds.width / n);
    let topViewHeight = Math.floor(topViewWidth / aspect_ratio);

    let bottomViewWidth = Math.floor(bounds.width / m);
    let bottomViewHeight = Math.floor(bottomViewWidth / aspect_ratio);

    if (m > 1) {
        bottomViewHeight = Math.floor(bottomViewWidth / aspect_ratio);
        bounds.y = bounds.y + Math.floor((bounds.height - topViewHeight - bottomViewHeight) / 2);
    } else {
        bottomViewHeight = bounds.height - topViewHeight;
    }

    for (let i = 0; i < n; i++) {
        let topBounds = { x: bounds.x + topViewWidth * i, y: bounds.y, width: topViewWidth, height: topViewHeight };
        views[i].setBounds(topBounds);
    }

    for (let i = 0; i < m; i++) {
        let bottomBounds = { x: bounds.x + bottomViewWidth * i, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };
        views[n + i].setBounds(bottomBounds);
    }
}

function setRectangleLayout(parent, views, cols, rows) {
    let bounds = getUsableBounds(parent);
    let ratio = aspect_ratio * cols / rows;
    let viewWidth = bounds.width;
    let viewHeight = bounds.height;
    let x = bounds.x;
    let y = bounds.y;

    if (bounds.width / bounds.height < ratio) {
        viewWidth = Math.floor(bounds.width / cols);
        if (rows > 1) {
            let newHeight = bounds.width / ratio;
            viewHeight = Math.floor(newHeight / rows);
            const barHeight = Math.floor((bounds.height - newHeight) / 2);
            y += barHeight;
        }
    } else {
        viewHeight = Math.floor(bounds.height / rows);
        if (cols > 1) {
            let newWidth = bounds.height * ratio;
            viewWidth = Math.floor(newWidth / cols);
            const barWidth = Math.floor((bounds.width - newWidth) / 2);
            x += barWidth;
        }
    }

    let size = { x: x, y: y, width: viewWidth, height: viewHeight };

    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            let viewIndex = r * cols + c;
            let viewX = size.x + size.width * c;
            let viewY = size.y + size.height * r;
            let viewBounds = { x: viewX, y: viewY, width: size.width, height: size.height };
            views[viewIndex].setBounds(viewBounds);
        }
    }
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
    if (layout === SIDES) updateSidesLayout(parent, views);
    if (layout === TRI) updateTriLayout(parent, views);
    if (layout === QUAD) updateQuadLayout(parent, views);
    if (layout === QUADH) updateQuadHorizontalLayout(parent, views);
    if (layout === QUADV) updateQuadVerticalLayout(parent, views);
    if (layout === FIVEH) updateFiveHorizontalLayout(parent, views);
    if (layout === FIVEV) updateFiveVerticalLayout(parent, views);
    if (layout === H4n1) updateH4n1Layout(parent, views);
    if (layout === V1n4) updateV1n4Layout(parent, views);
    if (layout === H6) updateSixHorizontalLayout(parent, views);
    if (layout === V6) updateSixVerticalLayout(parent, views);
    if (layout === H8) updateH8Layout(parent, views);
    if (layout === V8) updateV8Layout(parent, views);
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

    if (layout === SIDES)
        return [ 
            { name: "Left", number: 1 },
            { name: "Right", number: 2 },
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

    if (layout === V1n4)
        return [ 
            { name: "Left", number: 1 },
            { name: "Top right", number: 2 },
            { name: "Upper right", number: 3 },
            { name: "Lower right", number: 4 },
            { name: "Bottom right", number: 5 },
            { name: "All", number: null }
        ];

    if (layout === H4n1)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top center left", number: 2 },
            { name: "Top center right", number: 3 },
            { name: "Top right", number: 4 },
            { name: "Bottom", number: 5 },
            { name: "All", number: null }
        ];
  
    if (layout === H6)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top center", number: 2 },
            { name: "Top right", number: 3 },
            { name: "Bottom left", number: 4 },
            { name: "Bottom center", number: 5 },
            { name: "Bottom right", number: 6 },
            { name: "All", number: null }
        ];
  
    if (layout === V6)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top right", number: 2 },
            { name: "Middle left", number: 3 },
            { name: "Middle right", number: 4 },
            { name: "Bottom left", number: 5 },
            { name: "Bottom right", number: 6 },
            { name: "All", number: null }
        ];

    if (layout === V8)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top right", number: 2 },
            { name: "Upper-Middle left", number: 3 },
            { name: "Upper-Middle right", number: 4 },
            { name: "Lower-Middle left", number: 5 },
            { name: "Lower-Middle right", number: 6 },
            { name: "Bottom left", number: 7 },
            { name: "Bottom right", number: 8 },
            { name: "All", number: null }
        ];

    if (layout === H8)
        return [ 
            { name: "Top left", number: 1 },
            { name: "Top-left center", number: 2 },
            { name: "Top-right center", number: 3 },
            { name: "Top right", number: 4 },
            { name: "Bottom left", number: 5 },
            { name: "Bottom-left center", number: 6 },
            { name: "Bottom-right center", number: 7 },
            { name: "Bottom right", number: 8 },
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
        VIEW_COUNT[SIDES] = 2;
        VIEW_COUNT[TRI] = 3;
        VIEW_COUNT[QUAD] = 4;
        VIEW_COUNT[QUADH] = 4;
        VIEW_COUNT[QUADV] = 4;
        VIEW_COUNT[FIVEH] = 5;
        VIEW_COUNT[FIVEV] = 5;
        VIEW_COUNT[V1n4] = 5;
        VIEW_COUNT[H4n1] = 5;
        VIEW_COUNT[H6] = 6;
        VIEW_COUNT[V6] = 6;
        VIEW_COUNT[H8] = 8;
        VIEW_COUNT[V8] = 8;
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
    SIDES: SIDES,
    TRI: TRI,
    QUAD: QUAD,
    QUADH: QUADH,
    QUADV: QUADV,
    FIVEH: FIVEH,
    FIVEV: FIVEV,
    H4n1: H4n1,
    V1n4: V1n4,
    SIXH: H6,
    SIXV: V6,
    H8: H8,
    V8: V8,
    NINE: NINE
});